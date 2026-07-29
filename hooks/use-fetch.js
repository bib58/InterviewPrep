import { useState } from "react";
import { toast } from "sonner";

export default function useFetch(cb) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cb(...args);
      if (response && response.error) {
        const err = new Error(response.error);
        setError(err);
        toast.error(response.error);
        setData(undefined);
        return response;
      }
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return { data, loading, error, fn };
}
