// Piè di pagina dell'app: indirizzo e telefono del negozio.
// Su mobile il telefono va a capo su riga propria (d-block sotto sm).
export default function Footer() {
  return (
    <footer className="app-footer text-center small py-4 mt-4">
      © 2026 DacciUnTaglio, Via Roma 12, Milano
      <span className="d-none d-sm-inline"> — </span>
      <span className="d-block d-sm-inline mt-1 mt-sm-0">
        Tel.{" "}
        <a href="tel:+393331234567" className="text-decoration-none">
          +39 333 1234567
        </a>
      </span>
    </footer>
  );
}
