import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export function formatDateTime(value: string) {
  return dayjs(value).format("DD/MM/YYYY HH:mm");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
