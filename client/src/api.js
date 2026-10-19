
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result.message ||
        result.errors?.join(", ") ||
        `Request failed (${response.status})`
    );
    error.status = response.status;
    throw error;
  }

  return result;
}

export const candidateApi = {
  list(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        query.set(key, value);
      }
    });

    return request(`/candidates?${query.toString()}`);
  },

  get(id) {
    return request(`/candidates/${id}`);
  },

  create(candidate) {
    return request("/candidates", {
      method: "POST",
      body: JSON.stringify(candidate),
    });
  },

  update(id, candidate) {
    return request(`/candidates/${id}`, {
      method: "PUT",
      body: JSON.stringify(candidate),
    });
  },

  remove(id) {
    return request(`/candidates/${id}`, {
      method: "DELETE",
    });
  },

  dashboard() {
    return request("/dashboard");
  },
};



export const applicationApi = {
  list(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        query.set(key, value);
      }
    });

    return request(`/applications?${query.toString()}`);
  },

  get(id) {
    return request(`/applications/${id}`);
  },

  create(application) {
    return request("/applications", {
      method: "POST",
      body: JSON.stringify(application),
    });
  },

  updateStage(id, stage) {
    return request(`/applications/${id}/stage`, {
      method: "PUT",
      body: JSON.stringify({ stage }),
    });
  },

  remove(id) {
    return request(`/applications/${id}`, {
      method: "DELETE",
    });
  },
};


export const jobApi = {
  list() {
    return request("/jobs");
  },

  get(id) {
    return request(`/jobs/${id}`);
  },

  create(job) {
    return request("/jobs", {
      method: "POST",
      body: JSON.stringify(job),
    });
  },

  update(id, job) {
    return request(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(job),
    });
  },

  remove(id) {
    return request(`/jobs/${id}`, {
      method: "DELETE",
    });
  },
};