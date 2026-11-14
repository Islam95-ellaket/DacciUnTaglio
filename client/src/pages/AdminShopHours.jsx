import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import HoursForm from "../components/admin-shop-hours/HoursForm.jsx";
import RecurringBlocksForm from "../components/admin-shop-hours/RecurringBlocksForm.jsx";

/**
 * Pagina admin "Orari di apertura": orari settimanali + pause ricorrenti.
 * I due form sono componenti separati in components/admin-shop-hours/.
 */
export default function AdminShopHours() {
  const { token } = useContext(AuthContext);
  const { data: shop, loading, error, refetch } = useFetch("/shop", { token });

  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={refetch} />;

  // key su updatedAt: dopo il salvataggio i form si reimpostano coi valori appena salvati
  const formKey = shop.updatedAt ?? "shop";

  return (
    <>
      <HoursForm key={`hours-${formKey}`} shop={shop} token={token} />
      <RecurringBlocksForm key={`blocks-${formKey}`} shop={shop} token={token} />
    </>
  );
}
