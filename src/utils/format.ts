import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/es";

dayjs.extend(customParseFormat);
dayjs.locale("es");

export function formatDate(date: string): string {
  return dayjs(date).format("DD MMM YYYY");
}

export function formatTime(time: string): string {
  return dayjs(time, "HH:mm").format("h:mm A");
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-MX")}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
