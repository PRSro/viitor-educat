import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  lessonSchema,
  validateForm,
  getFirstError,
} from '@/lib/validation';

describe("emailSchema", () => {
  it("accepts valid email", () => {
    const result = emailSchema.safeParse("test@example.com");
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = emailSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = emailSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects email without @", () => {
    const result = emailSchema.safeParse("testexample.com");
    expect(result.success).toBe(false);
  });

  it("rejects email without domain", () => {
    const result = emailSchema.safeParse("test@");
    expect(result.success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts valid password", () => {
    const result = passwordSchema.safeParse("Password1");
    expect(result.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const result = passwordSchema.safeParse("password1");
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = passwordSchema.safeParse("PASSWORD1");
    expect(result.success).toBe(false);
  });

  it("rejects password without digit", () => {
    const result = passwordSchema.safeParse("Password");
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = passwordSchema.safeParse("Pass1");
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "bad",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      role: "STUDENT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      role: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "weak",
      role: "STUDENT",
    });
    expect(result.success).toBe(false);
  });
});

describe("lessonSchema", () => {
  it("accepts valid lesson data", () => {
    const result = lessonSchema.safeParse({
      title: "Introduction to Math",
      description: "Basic math concepts",
      content: "# Math Content",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = lessonSchema.safeParse({
      title: "",
      content: "# Content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = lessonSchema.safeParse({
      title: "Title",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional description", () => {
    const result = lessonSchema.safeParse({
      title: "Title",
      content: "# Content",
    });
    expect(result.success).toBe(true);
  });
});

describe("validateForm", () => {
  it("returns success with data on valid input", () => {
    const result = validateForm(loginSchema, {
      email: "test@example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("returns errors on invalid input", () => {
    const result = validateForm(loginSchema, {
      email: "bad",
      password: "",
    });
    expect(result.success).toBe(false);
    const errors = result.success ? [] : result.errors;
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("getFirstError", () => {
  it("returns null on valid input", () => {
    const error = getFirstError(loginSchema, {
      email: "test@example.com",
      password: "password",
    });
    expect(error).toBeNull();
  });

  it("returns first error message on invalid input", () => {
    const error = getFirstError(loginSchema, {
      email: "bad",
      password: "",
    });
    expect(error).not.toBeNull();
    expect(typeof error).toBe("string");
  });
});
