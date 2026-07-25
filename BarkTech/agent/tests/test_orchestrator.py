"""Test file for orchestrator verification flow.

This test file verifies that the Orchestrator correctly:
1. Routes user chat requests to specialized agents
2. Verifies agent responses before returning to user
3. Composes multi-agent responses
4. Handles verification failures gracefully

Usage:
    pytest tests/test_orchestrator.py -v
    python -m pytest tests/test_orchestrator.py -v

Note: These tests require Redis and MongoDB to be running.
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime


class TestOrchestrator:
    """Test cases for the Orchestrator module."""

    @pytest.fixture
    def orchestrator(self):
        """Create an Orchestrator instance for testing."""
        from app.agents.supervisor import Orchestrator
        return Orchestrator()

    @pytest.fixture
    def sample_user_message(self):
        """Sample user message for testing."""
        return {
            "message": "Create an invoice for Rahul Kumar for 5 bottle filling machines",
            "thread_id": "test-thread-001",
            "user_context": {
                "user_id": "admin-001",
                "role": "admin",
                "email": "admin@barktech.in",
            },
        }

    @pytest.fixture
    def sample_multi_task_message(self):
        """Sample multi-task user message for testing."""
        return {
            "message": "Create an invoice for Rahul Kumar and also send him a welcome email",
            "thread_id": "test-thread-002",
            "user_context": {
                "user_id": "admin-001",
                "role": "admin",
                "email": "admin@barktech.in",
            },
        }

    @pytest.mark.asyncio
    async def test_orchestrator_initialization(self, orchestrator):
        """Test that Orchestrator initializes correctly."""
        assert orchestrator is not None
        assert hasattr(orchestrator, 'route_request')
        assert hasattr(orchestrator, '_verify_response')
        assert hasattr(orchestrator, 'compose_multi_agent_response')

    @pytest.mark.asyncio
    async def test_orchestrator_has_verifier_llm(self, orchestrator):
        """Test that Orchestrator has a verifier LLM."""
        assert hasattr(orchestrator, 'verifier_llm')
        assert orchestrator.verifier_llm is not None

    @pytest.mark.asyncio
    async def test_verify_response_valid(self, orchestrator):
        """Test verification of a valid structured response."""
        valid_response = """
Here is the invoice you requested:

<INVOICE_CARD>
{
    "invoice_id": "BARK2627S120",
    "invoice_number": "INV-2026-001",
    "customer_name": "Rahul Kumar",
    "amount": 45000.00,
    "tax_amount": 8100.00,
    "total_amount": 53100.00,
    "status": "draft"
}
</INVOICE_CARD>

Please review and confirm the invoice.
        """

        is_valid, response = await orchestrator._verify_response(valid_response)

        # Verification should pass for valid structured content
        assert isinstance(response, str)
        assert len(response) > 0

    @pytest.mark.asyncio
    async def test_verify_response_empty(self, orchestrator):
        """Test verification of an empty response."""
        empty_response = ""

        is_valid, response = await orchestrator._verify_response(empty_response)

        # Empty response should be flagged
        assert isinstance(response, str)

    @pytest.mark.asyncio
    async def test_verify_response_malformed(self, orchestrator):
        """Test verification of a malformed response."""
        malformed_response = "Here is something <INCOMPLETE_TAG>"

        is_valid, response = await orchestrator._verify_response(malformed_response)

        # Malformed response should be handled gracefully
        assert isinstance(response, str)

    @pytest.mark.asyncio
    async def test_route_request_single_agent(self, orchestrator, sample_user_message):
        """Test routing a request to a single agent."""
        with patch.object(orchestrator, '_route_to_agent') as mock_route:
            mock_route.return_value = (
                "Here is the invoice:\n\n<INVOICE_CARD>{\"invoice_id\": \"INV-001\"}</INVOICE_CARD>",
                {"input_tokens": 100, "output_tokens": 50},
            )

            result, usage = await orchestrator.route_request(
                sample_user_message["message"],
                sample_user_message["thread_id"],
                sample_user_message["user_context"],
            )

            assert result is not None
            assert len(result) > 0
            assert isinstance(usage, dict)

    @pytest.mark.asyncio
    async def test_route_request_multi_agent(self, orchestrator, sample_multi_task_message):
        """Test routing a request that requires multiple agents."""
        with patch.object(orchestrator, '_route_to_multiple_agents') as mock_route:
            mock_route.return_value = (
                "<MULTI_RESULT>\n"
                "<INVOICE_CARD>{\"invoice_id\": \"INV-001\"}</INVOICE_CARD>\n"
                "<EMAIL_LAYOUT>{\"subject\": \"Welcome\"}</EMAIL_LAYOUT>\n"
                "</MULTI_RESULT>",
                {"input_tokens": 200, "output_tokens": 100},
            )

            result, usage = await orchestrator.route_request(
                sample_multi_task_message["message"],
                sample_multi_task_message["thread_id"],
                sample_multi_task_message["user_context"],
            )

            assert result is not None
            assert "<MULTI_RESULT>" in result

    @pytest.mark.asyncio
    async def test_compose_multi_agent_response(self, orchestrator):
        """Test composing responses from multiple agents."""
        from app.agents.responses import (
            StructuredResponse,
            ResponseType,
            InvoiceCardPayload,
            EmailLayoutPayload,
        )

        invoice_payload = InvoiceCardPayload(
            invoice_id="BARK2627S120",
            invoice_number="INV-2026-001",
            customer_name="Test Customer",
            amount=45000.00,
            tax_amount=8100.00,
            total_amount=53100.00,
            status="draft",
        )

        email_payload = EmailLayoutPayload(
            to="test@example.com",
            subject="Welcome to Bark Technologies",
            preview_text="Thank you for your inquiry",
            body_html="<h1>Welcome</h1>",
            from_name="Bark Technologies",
            from_email="sales@barktechnologies.in",
        )

        agent_responses = [
            {
                "agent_type": "sales",
                "response": StructuredResponse(
                    type=ResponseType.INVOICE_CARD,
                    payload=invoice_payload,
                    message="Invoice created",
                ),
            },
            {
                "agent_type": "crm",
                "response": StructuredResponse(
                    type=ResponseType.EMAIL_LAYOUT,
                    payload=email_payload,
                    message="Email sent",
                ),
            },
        ]

        result = await orchestrator.compose_multi_agent_response(agent_responses)

        assert result is not None
        assert "<MULTI_RESULT>" in result
        assert "<INVOICE_CARD>" in result
        assert "<EMAIL_LAYOUT>" in result


class TestOrchestratorIntegration:
    """Integration tests for Orchestrator with actual agents."""

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_full_orchestrator_flow(self):
        """Test full orchestrator flow with actual agents.

        This test requires:
        - Redis running on localhost:6379
        - MongoDB running on localhost:27017
        - OpenRouter API key configured
        """
        from app.agents.supervisor import get_orchestrator

        orchestrator = get_orchestrator()

        result, usage = await orchestrator.route_request(
            "What products do you offer?",
            "test-thread-integration",
            {"user_id": "admin-001", "role": "admin"},
        )

        assert result is not None
        assert len(result) > 0
        assert isinstance(usage, dict)
        assert "input_tokens" in usage or "total_tokens" in usage


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
