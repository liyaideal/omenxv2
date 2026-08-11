import { Navigate, useLocation } from "react-router-dom";

/**
 * /vouchers is retired (Vouchers v2 Round A) — vouchers now live in the
 * /rewards "Vouchers" tab. Any existing deep link params are preserved and
 * forwarded alongside ?tab=vouchers.
 */
const Vouchers = () => {
  const { search, hash } = useLocation();
  const params = new URLSearchParams(search);
  params.set("tab", "vouchers");
  return <Navigate to={`/rewards?${params.toString()}${hash}`} replace />;
};

export default Vouchers;
