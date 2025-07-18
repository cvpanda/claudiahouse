#!/usr/bin/env node

/**
 * Test script to verify authentication endpoints
 * Run with: node test-auth.js
 */

const API_BASE = "http://localhost:3000/api";

async function testLogin(email, password) {
  try {
    console.log(`\n🔐 Testing login for: ${email}`);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Login successful");
      console.log(`   User: ${data.user.firstName} ${data.user.lastName}`);
      console.log(`   Role: ${data.user.role.name}`);
      console.log(
        `   Permissions: ${
          data.user.role.permissions.filter((p) => p.granted).length
        } granted`
      );

      // Test getting user info
      const cookies = response.headers.get("set-cookie");
      if (cookies) {
        const meResponse = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Cookie: cookies,
          },
        });

        if (meResponse.ok) {
          console.log("✅ Token validation successful");
        } else {
          console.log("❌ Token validation failed");
        }
      }
    } else {
      console.log("❌ Login failed:", data.message);
    }
  } catch (error) {
    console.log("❌ Login error:", error.message);
  }
}

async function testUsersEndpoint() {
  try {
    console.log("\n📋 Testing users endpoint (should require auth)");

    const response = await fetch(`${API_BASE}/users`);
    const data = await response.json();

    if (response.status === 401) {
      console.log("✅ Correctly blocked unauthorized access");
    } else {
      console.log("❌ Should have blocked unauthorized access");
    }
  } catch (error) {
    console.log("❌ Error testing users endpoint:", error.message);
  }
}

async function runTests() {
  console.log("🚀 Starting authentication tests...");
  console.log(
    "⚠️  Make sure the development server is running on http://localhost:3000"
  );

  await testUsersEndpoint();

  // Test with example users
  await testLogin("admin@claudiahouse.com", "admin123");
  await testLogin("vendedor@claudiahouse.com", "vendedor123");
  await testLogin("almacen@claudiahouse.com", "almacen123");
  await testLogin("invalid@email.com", "wrongpassword");

  console.log("\n✅ Authentication tests completed!");
  console.log("\n📝 You can now:");
  console.log("   1. Visit http://localhost:3000/login");
  console.log("   2. Use any of the example users to login");
  console.log("   3. Test the permission-based navigation");
  console.log("   4. Access the settings page to manage users and roles");
}

runTests().catch(console.error);
