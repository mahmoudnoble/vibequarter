import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Booking" };

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Booking agent</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        An AI agent that turns visitors into booked appointments — including over WhatsApp.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
          <Icon name="CalendarCheck" className="h-6 w-6" />
        </span>
        <p className="font-semibold text-foreground">Coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">We&apos;ll set up the booking agent together in a later step.</p>
      </div>
    </div>
  );
}
