import { useEffect, useState } from "react";
import { api, type CampusRecord } from "./api";
export function useRecords(path: string, key: string) {
  const [result, setResult] = useState<{ path: string; records: CampusRecord[]; error: string }>({ path: "", records: [], error: "" });
  useEffect(() => {
    let active = true;
    api(path).then(data => { if (active) setResult({ path, records: data[key], error: "" }); })
      .catch(error => { if (active) setResult({ path, records: [], error: error instanceof Error ? error.message : "Unable to load records" }); });
    return () => { active = false; };
  }, [path, key]);
  return { records: result.path === path ? result.records : [], loading: result.path !== path, error: result.path === path ? result.error : "" };
}
