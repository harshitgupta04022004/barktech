"""Test file for event-direct routing end-to-end verification.

This test file verifies that the Event Router correctly routes events
from Redis Streams to specialized agents and returns responses back.

Usage:
    pytest tests/test_event_router.py -v
    python -m pytest tests/test_event_router.py -v

Note: These tests require Redis and MongoDB to be running.
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime


class TestEventRouter:
    """Test cases for the Event Router module."""

    @pytest.fixture
    def event_router(self):
        """Create an EventRouter instance for testing."""
        from app.agents.event_router import EventRouter
        return EventRouter()

    @pytest.fixture
    def sample_invoice_event(self):
        """Sample invoice paid event."""
        return {
            "event_type": "InvoicePaid",
            "data": {
                "invoice_id": "BARK2627S120",
                "customer_id": "CUST-883",
                "amount": 45000.00,
                "currency": "INR",
                "payment_method": "bank_transfer",
                "paid_at": datetime.now().isoformat(),
            },
        }

    @pytest.fixture
    def sample_lead_event(self):
        """Sample lead created event."""
        return {
            "event_type": "LeadCreated",
            "data": {
                "lead_id": "LEAD-001",
                "contact_name": "Rahul Kumar",
                "company": "ABC Corp",
                "email": "rahul@abc.com",
                "product_interest": "Bottle Filling Machine",
                "source": "website",
            },
        }

    @pytest.mark.asyncio
    async def test_event_router_initialization(self, event_router):
        """Test that EventRouter initializes correctly."""
        assert event_router is not None
        assert hasattr(event_router, 'route_event')
        assert hasattr(event_router, '_publish_response')
        assert hasattr(event_router, 'EVENT_ROUTER')

    @pytest.mark.asyncio
    async def test_event_router_mapping(self, event_router):
        """Test that EVENT_ROUTER mapping is correct."""
        assert "InvoicePaid" in event_router.EVENT_ROUTER
        assert "LeadCreated" in event_router.EVENT_ROUTER
        assert "ProductStockLow" in event_router.EVENT_ROUTER
        assert "ContentPublished" in event_router.EVENT_ROUTER

    @pytest.mark.asyncio
    async def test_route_event_unknown_type(self, event_router):
        """Test routing an unknown event type."""
        result = await event_router.route_event("UnknownEvent", {})
        assert result is None

    @pytest.mark.asyncio
    async def test_publish_response(self, event_router):
        """Test that _publish_response correctly formats and publishes."""
        with patch.object(event_router, '_redis', new_callable=AsyncMock) as mock_redis:
            await event_router._publish_response(
                event_type="InvoicePaid",
                agent_type="sales",
                result={"success": True, "message": "Test"},
            )
            mock_redis.xadd.assert_called_once()

    @pytest.mark.asyncio
    async def test_route_event_invoice(self, event_router, sample_invoice_event):
        """Test routing an invoice event to the sales agent."""
        with patch.object(event_router, '_redis', new_callable=AsyncMock) as mock_redis:
            with patch('app.agents.event_router.get_sales_agent') as mock_get_agent:
                mock_agent = AsyncMock()
                mock_agent.process_event.return_value = {
                    "success": True,
                    "message": "Invoice processed",
                    "structured_response": {"type": "invoice_card"},
                }
                mock_get_agent.return_value = mock_agent

                result = await event_router.route_event(
                    sample_invoice_event["event_type"],
                    sample_invoice_event["data"],
                )

                assert result is not None
                assert result["success"] is True
                mock_agent.process_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_route_event_lead(self, event_router, sample_lead_event):
        """Test routing a lead event to the CRM agent."""
        with patch.object(event_router, '_redis', new_callable=AsyncMock) as mock_redis:
            with patch('app.agents.event_router.get_crm_agent') as mock_get_agent:
                mock_agent = AsyncMock()
                mock_agent.process_event.return_value = {
                    "success": True,
                    "message": "Lead created",
                    "structured_response": {"type": "lead_card"},
                }
                mock_get_agent.return_value = mock_agent

                result = await event_router.route_event(
                    sample_lead_event["event_type"],
                    sample_lead_event["data"],
                )

                assert result is not None
                assert result["success"] is True
                mock_agent.process_event.assert_called_once()


class TestStructuredResponses:
    """Test cases for structured response serialization."""

    def test_serialize_invoice_card(self):
        """Test serializing an InvoiceCard to XML."""
        from app.agents.responses import (
            StructuredResponse,
            ResponseType,
            InvoiceCardPayload,
        )
        from app.agents.serializer import serialize_response

        payload = InvoiceCardPayload(
            invoice_id="BARK2627S120",
            invoice_number="INV-2026-001",
            customer_name="Test Customer",
            amount=45000.00,
            tax_amount=8100.00,
            total_amount=53100.00,
            status="paid",
        )

        response = StructuredResponse(
            type=ResponseType.INVOICE_CARD,
            payload=payload,
            message="Invoice processed successfully",
        )

        xml = serialize_response(response)

        assert "<INVOICE_CARD>" in xml
        assert "</INVOICE_CARD>" in xml
        assert "BARK2627S120" in xml
        assert "INV-2026-001" in xml

    def test_serialize_multi_response(self):
        """Test serializing multiple StructuredResponses."""
        from app.agents.responses import (
            StructuredResponse,
            ResponseType,
            InvoiceCardPayload,
            LeadCardPayload,
        )
        from app.agents.serializer import serialize_multi_response

        invoice_payload = InvoiceCardPayload(
            invoice_id="BARK2627S120",
            invoice_number="INV-2026-001",
            customer_name="Test Customer",
            amount=45000.00,
            tax_amount=8100.00,
            total_amount=53100.00,
            status="paid",
        )

        lead_payload = LeadCardPayload(
            lead_id="LEAD-001",
            contact_name="Rahul Kumar",
            company="ABC Corp",
            email="rahul@abc.com",
            phone="+91-9876543210",
            product_interest="Bottle Filling Machine",
            status="new",
            priority="high",
        )

        responses = [
            StructuredResponse(
                type=ResponseType.INVOICE_CARD,
                payload=invoice_payload,
                message="Invoice processed",
            ),
            StructuredResponse(
                type=ResponseType.LEAD_CARD,
                payload=lead_payload,
                message="Lead created",
            ),
        ]

        xml = serialize_multi_response(responses)

        assert "<MULTI_RESULT>" in xml
        assert "</MULTI_RESULT>" in xml
        assert "<INVOICE_CARD>" in xml
        assert "<LEAD_CARD>" in xml

    def test_parse_xml_response(self):
        """Test parsing XML-tagged content back to structured blocks."""
        from app.agents.serializer import parse_xml_response

        content = """
Here is the invoice:

<INVOICE_CARD>
{
    "invoice_id": "BARK2627S120",
    "invoice_number": "INV-2026-001",
    "customer_name": "Test Customer",
    "amount": 45000.00
}
</INVOICE_CARD>

And here is the lead:

<LEAD_CARD>
{
    "lead_id": "LEAD-001",
    "contact_name": "Rahul Kumar",
    "company": "ABC Corp"
}
</LEAD_CARD>
        """

        blocks = parse_xml_response(content)

        assert len(blocks) == 2
        assert blocks[0]["type"] == "INVOICE_CARD"
        assert blocks[1]["type"] == "LEAD_CARD"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
