/**
 * Script de prueba para verificar la funcionalidad de clientes con ubicación y sucursales de envío
 */

async function testCustomerLocationAndShippingBranches() {
  const BASE_URL = "http://localhost:3000";

  console.log(
    "🧪 Iniciando pruebas de clientes con ubicación y sucursales de envío...\n"
  );

  try {
    // 1. Crear un cliente con información de ubicación
    console.log("1. Creando cliente con información de ubicación...");
    const customerData = {
      name: "Juan Pérez",
      email: "juan.perez@email.com",
      phone: "+54 9 11 1234-5678",
      address: "Av. Corrientes 1234",
      postalCode: "C1043AAZ",
      province: "Buenos Aires",
      city: "CABA",
      country: "Argentina",
      cuit: "20-12345678-9",
      customerType: "retail",
      isActive: true,
    };

    const createResponse = await fetch(`${BASE_URL}/api/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    });

    if (!createResponse.ok) {
      throw new Error(`Error creating customer: ${createResponse.status}`);
    }

    const customer = await createResponse.json();
    console.log(`✅ Cliente creado: ${customer.name} (ID: ${customer.id})`);
    console.log(
      `   📍 Ubicación: ${customer.address}, ${customer.city}, ${customer.province} - ${customer.postalCode}\n`
    );

    // 2. Agregar sucursales de envío
    console.log("2. Agregando sucursales de envío...");

    const branches = [
      {
        name: "Correo Argentino Centro",
        address: "Sarmiento 151",
        province: "Buenos Aires",
        city: "CABA",
        postalCode: "C1041AAB",
        branchCode: "001",
      },
      {
        name: "OCA Palermo",
        address: "Av. Santa Fe 2954",
        province: "Buenos Aires",
        city: "CABA",
        postalCode: "C1425BGI",
        branchCode: "PAL001",
      },
    ];

    const createdBranches = [];
    for (let i = 0; i < branches.length; i++) {
      const branchResponse = await fetch(
        `${BASE_URL}/api/customers/${customer.id}/shipping-branches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(branches[i]),
        }
      );

      if (!branchResponse.ok) {
        throw new Error(`Error creating branch: ${branchResponse.status}`);
      }

      const branch = await branchResponse.json();
      createdBranches.push(branch);
      console.log(
        `✅ Sucursal creada: ${branch.name} - ${branch.city}, ${branch.province}`
      );
    }

    // 3. Obtener cliente con sucursales
    console.log("\n3. Verificando cliente y sucursales...");
    const getCustomerResponse = await fetch(
      `${BASE_URL}/api/customers/${customer.id}`
    );

    if (!getCustomerResponse.ok) {
      throw new Error(`Error fetching customer: ${getCustomerResponse.status}`);
    }

    const customerDetails = await getCustomerResponse.json();
    console.log(`✅ Cliente obtenido: ${customerDetails.name}`);
    console.log(`   📧 Email: ${customerDetails.email}`);
    console.log(`   📱 Teléfono: ${customerDetails.phone}`);
    console.log(`   📍 Dirección: ${customerDetails.address}`);
    console.log(
      `   🌍 Ubicación: ${customerDetails.city}, ${customerDetails.province}, ${customerDetails.country} - ${customerDetails.postalCode}`
    );

    // 4. Obtener sucursales de envío
    const getBranchesResponse = await fetch(
      `${BASE_URL}/api/customers/${customer.id}/shipping-branches`
    );

    if (!getBranchesResponse.ok) {
      throw new Error(`Error fetching branches: ${getBranchesResponse.status}`);
    }

    const fetchedBranches = await getBranchesResponse.json();
    console.log(`\n📦 Sucursales de envío (${fetchedBranches.length}):`);
    fetchedBranches.forEach((branch, index) => {
      console.log(`   ${index + 1}. ${branch.name}`);
      console.log(
        `      📍 ${branch.address}, ${branch.city}, ${branch.province} - ${branch.postalCode}`
      );
      if (branch.branchCode) {
        console.log(`      🏷️  Código: ${branch.branchCode}`);
      }
    });

    // 5. Actualizar información del cliente
    console.log("\n4. Actualizando información del cliente...");
    const updateData = {
      ...customerDetails,
      phone: "+54 9 11 8765-4321",
      address: "Av. Rivadavia 5678",
      postalCode: "C1406GHI",
    };

    const updateResponse = await fetch(
      `${BASE_URL}/api/customers/${customer.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Error updating customer: ${updateResponse.status}`);
    }

    const updatedCustomer = await updateResponse.json();
    console.log(`✅ Cliente actualizado: ${updatedCustomer.name}`);
    console.log(`   📱 Nuevo teléfono: ${updatedCustomer.phone}`);
    console.log(
      `   📍 Nueva dirección: ${updatedCustomer.address} - ${updatedCustomer.postalCode}`
    );

    // 6. Actualizar una sucursal
    console.log("\n5. Actualizando sucursal de envío...");
    const firstBranch = createdBranches[0];
    const branchUpdateData = {
      ...firstBranch,
      name: "Correo Argentino Centro - Actualizado",
      branchCode: "001-UPD",
    };

    const updateBranchResponse = await fetch(
      `${BASE_URL}/api/customers/${customer.id}/shipping-branches/${firstBranch.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchUpdateData),
      }
    );

    if (!updateBranchResponse.ok) {
      throw new Error(`Error updating branch: ${updateBranchResponse.status}`);
    }

    const updatedBranch = await updateBranchResponse.json();
    console.log(`✅ Sucursal actualizada: ${updatedBranch.name}`);
    console.log(`   🏷️  Nuevo código: ${updatedBranch.branchCode}`);

    // 7. Eliminar una sucursal
    console.log("\n6. Eliminando una sucursal...");
    const deleteResponse = await fetch(
      `${BASE_URL}/api/customers/${customer.id}/shipping-branches/${createdBranches[1].id}`,
      {
        method: "DELETE",
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(`Error deleting branch: ${deleteResponse.status}`);
    }

    console.log(`✅ Sucursal eliminada: ${createdBranches[1].name}`);

    // 8. Verificar lista final
    console.log("\n7. Verificando estado final...");
    const finalBranchesResponse = await fetch(
      `${BASE_URL}/api/customers/${customer.id}/shipping-branches`
    );
    const finalBranches = await finalBranchesResponse.json();

    console.log(`📦 Sucursales restantes: ${finalBranches.length}`);
    finalBranches.forEach((branch, index) => {
      console.log(
        `   ${index + 1}. ${branch.name} (${branch.branchCode || "Sin código"})`
      );
    });

    console.log("\n✅ ¡Todas las pruebas pasaron exitosamente!");
    console.log(`🎉 Cliente de prueba creado con ID: ${customer.id}`);

    return {
      success: true,
      customerId: customer.id,
      branchesCount: finalBranches.length,
    };
  } catch (error) {
    console.error("❌ Error en las pruebas:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Ejecutar las pruebas
testCustomerLocationAndShippingBranches()
  .then((result) => {
    if (result.success) {
      console.log(
        `\n🎯 Resumen: Cliente creado exitosamente con ${result.branchesCount} sucursal(es) de envío`
      );
      process.exit(0);
    } else {
      console.log(`\n💥 Las pruebas fallaron: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("💥 Error inesperado:", error);
    process.exit(1);
  });
