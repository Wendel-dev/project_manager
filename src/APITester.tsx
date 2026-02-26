import { useRef, type FormEvent } from "react";
import { useAuth } from "./UI/contexts/AuthContext";

export function APITester() {
  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const { token } = useAuth();

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const endpoint = formData.get("endpoint") as string;
      const url = new URL(endpoint, location.href);
      const method = formData.get("method") as string;
      const res = await fetch(url, { 
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      responseInputRef.current!.value = JSON.stringify(data, null, 2);
    } catch (error) {
      responseInputRef.current!.value = String(error);
    }
  };

  return (
    <div className="api-tester">
      <form onSubmit={testEndpoint} className="endpoint-row">
        <select name="method" className="method">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PATCH">PATCH</option>
        </select>
        <input type="text" name="endpoint" defaultValue="/api/projects" className="url-input" placeholder="/api/projects" />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
      <textarea ref={responseInputRef} readOnly placeholder="Response will appear here..." className="response-area" />
    </div>
  );
}
