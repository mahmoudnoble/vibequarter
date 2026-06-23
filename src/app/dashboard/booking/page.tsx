import { getOwner } from "@/lib/tenant";
import {
  ensureClinicContext,
  getAllAppointmentsFull,
  getPatients,
  toServiceViews,
  toWorkingHourInputs,
} from "@/lib/booking/clinic";
import { BookingStudio } from "./booking-studio";

export const metadata = { title: "Booking agent" };

export default async function BookingPage() {
  const owner = await getOwner();
  const ctx = owner ? await ensureClinicContext(owner) : null;

  const [allAppts, patients] = ctx && owner
    ? await Promise.all([
        getAllAppointmentsFull(ctx.clinic.id, owner),
        getPatients(ctx.clinic.id, owner),
      ])
    : [[], []];

  return (
    <BookingStudio
      clinicId={ctx?.clinic.id ?? ""}
      clinicName={ctx?.clinic.name ?? ""}
      waPnId={ctx?.clinic.whatsapp_phone_number_id ?? null}
      timezone={ctx?.clinic.timezone ?? "Asia/Riyadh"}
      services={ctx ? toServiceViews(ctx.services) : []}
      workingHours={ctx ? toWorkingHourInputs(ctx.hours) : []}
      initialAppointments={allAppts}
      initialPatients={patients}
    />
  );
}
