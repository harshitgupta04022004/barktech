import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          If you have any questions or queries, a member of our staff will always be happy to help.
          Feel free to contact us by telephone or email and we will be sure to get back to you as soon as possible.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Info — Head Office */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Head Office — Ghaziabad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">SF-03, Local Shopping Complex, Shushat Aquapolis, Ghaziabad - 201009, Uttar Pradesh, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="tel:+918810597980" className="text-sm hover:text-primary">+91 8810597980</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="mailto:info@barktechnologies.in" className="text-sm hover:text-primary">info@barktechnologies.in</a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm">Mon - Fri: 10:00 - 18:00</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spare Branch Office — Noida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">F-41, 1st Floor, Sec 9, Noida 201301, UP, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="tel:+919266244587" className="text-sm hover:text-primary">+91 9266244587</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="mailto:info@barktechnologies.in" className="text-sm hover:text-primary">info@barktechnologies.in</a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Accommodation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Ahmedabad & Vadodara, Gujarat, India</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="tel:+919266244587" className="text-sm hover:text-primary">+91 9266244587</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="mailto:info@barktechnologies.in" className="text-sm hover:text-primary">info@barktechnologies.in</a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request a Call Back</CardTitle>
              <p className="text-sm text-muted-foreground">Please get in touch and our expert support team will answer all your questions.</p>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                <Input placeholder="Full Name *" required />
                <Input placeholder="Email Address *" type="email" required />
                <Input placeholder="Phone Number" />
                <Input placeholder="Company Name" />
                <div className="sm:col-span-2"><Input placeholder="Subject" /></div>
                <div className="sm:col-span-2">
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Your message or query..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit"><Send className="h-4 w-4" /> Submit</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Additional contact info */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-semibold">Sales Enquiries</div>
              <a href="mailto:sales1@barktechnologies.in" className="text-sm text-primary hover:underline">sales1@barktechnologies.in</a>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-semibold">Service & Support</div>
              <a href="mailto:service@barktechnologies.in" className="text-sm text-primary hover:underline">service@barktechnologies.in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
