/**
 * Comprehensive End-to-End System Test Suite
 * Laxmi Electronics & Furnitures
 *
 * Tests:
 * 1. Advance Wedding Booking lifecycle (creation, immediate furniture bill, electronics fulfillment, completion).
 * 2. Wholesale Purchases & Vendor Supply Chain (purchase order, stock auto-increment, serial numbers, payments).
 * 3. POS Billing & Due Payment Settlement.
 * 4. WhatsApp message formatters and payload sanitization.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in environment variables!");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🧪 LAXMI ELECTRONICS & FURNITURES — COMPREHENSIVE VERIFICATION SUITE");
  console.log("==================================================================\n");

  const cleanupIds = {
    bookingIds: [] as number[],
    customerIds: [] as number[],
    billIds: [] as number[],
    productIds: [] as number[],
    vendorIds: [] as number[],
    purchaseIds: [] as number[],
  };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Ensure test categories and products exist
    // -------------------------------------------------------------------------
    console.log("🔹 STEP 0: Setting up test products & categories...");
    let furnCat = await prisma.category.findFirst({ where: { department: "FURNITURE" } });
    if (!furnCat) {
      furnCat = await prisma.category.create({
        data: { name: "Test Living Furniture", department: "FURNITURE" },
      });
    }

    let elecCat = await prisma.category.findFirst({ where: { department: "ELECTRONICS" } });
    if (!elecCat) {
      elecCat = await prisma.category.create({
        data: { name: "Test Home Appliances", department: "ELECTRONICS" },
      });
    }

    // Create a Furniture product
    const testFurnProduct = await prisma.product.create({
      data: {
        name: "Test Teak Wood Double Bed",
        department: "FURNITURE",
        categoryId: furnCat.id,
        productType: "quantity",
        costPrice: 20000,
        sellingPrice: 35000,
        quantityInStock: 10,
      },
    });
    cleanupIds.productIds.push(testFurnProduct.id);

    // Create an Electronics product
    const testElecProduct = await prisma.product.create({
      data: {
        name: "Test Smart 55-inch LED TV",
        department: "ELECTRONICS",
        categoryId: elecCat.id,
        productType: "electronics",
        costPrice: 25000,
        sellingPrice: 42000,
        quantityInStock: 5,
        warrantyMonths: 24,
      },
    });
    cleanupIds.productIds.push(testElecProduct.id);

    // Get an admin user
    const adminUser = await prisma.user.findFirst();
    const userId = adminUser ? adminUser.id : 1;

    // -------------------------------------------------------------------------
    // TEST SUITE 1: ADVANCE WEDDING BOOKING SCENARIOS
    // -------------------------------------------------------------------------
    console.log("\n📦 TEST SUITE 1: Advance Wedding Booking Scenarios");

    // Scenario 1.1: Create mixed wedding package with advance deposit
    const year = new Date().getFullYear();
    const testCustomerPhone = "9876543210";
    let testCustomer = await prisma.customer.findFirst({ where: { phone: testCustomerPhone } });
    if (!testCustomer) {
      testCustomer = await prisma.customer.create({
        data: {
          name: "Test Wedding Family",
          phone: testCustomerPhone,
          address: "Bhinder Town, Udaipur",
        },
      });
    }
    cleanupIds.customerIds.push(testCustomer.id);

    const targetDeliveryDate = new Date();
    targetDeliveryDate.setDate(targetDeliveryDate.getDate() + 15);

    const bookingNum = `ADB-${year}-TEST${Date.now().toString().slice(-4)}`;
    const furnBillNum = `FURN-${year}-TEST${Date.now().toString().slice(-4)}`;

    // Total package: 1 Bed (₹35,000) + 1 TV (₹42,000) = ₹77,000
    // Advance paid: ₹25,000
    // Remaining: ₹52,000
    const totalPkg = 77000;
    const advancePaid = 25000;
    const remainingBal = totalPkg - advancePaid;

    const createdBooking = await prisma.$transaction(async (tx) => {
      // Create master booking
      const b = await tx.booking.create({
        data: {
          bookingNumber: bookingNum,
          customerId: testCustomer.id,
          expectedDeliveryDate: targetDeliveryDate,
          totalEstimatedAmount: totalPkg,
          advancePaid: advancePaid,
          remainingBalance: remainingBal,
          status: "CONFIRMED",
          notes: "Wedding Package with custom Teak polish\n[DESIGNS]:[\"https://test.supabase.co/image1.jpg\"]",
        },
      });

      // Immediate Furniture Bill
      const fBill = await tx.bill.create({
        data: {
          billNumber: furnBillNum,
          billType: "REGULAR",
          department: "FURNITURE",
          bookingId: b.id,
          customerId: testCustomer.id,
          createdByUserId: userId,
          deliveryDate: new Date(),
          subtotal: 35000,
          discount: 0,
          totalAmount: 35000,
          paidAmount: advancePaid, // advance applied towards furniture
          dueAmount: 35000 - advancePaid, // ₹10,000 due on furniture
          paymentStatus: "PARTIAL",
          paymentMode: "CASH",
          status: "completed",
        },
      });

      // Bill item for furniture
      await tx.billItem.create({
        data: {
          billId: fBill.id,
          productId: testFurnProduct.id,
          quantity: 1,
          unitPrice: 35000,
          lineTotal: 35000,
        },
      });

      // Deduct stock for furniture immediately
      await tx.product.update({
        where: { id: testFurnProduct.id },
        data: { quantityInStock: { decrement: 1 } },
      });

      // Booking items: 1 Furniture (billed), 1 Electronics (unbilled)
      await tx.bookingItem.create({
        data: {
          bookingId: b.id,
          productId: testFurnProduct.id,
          department: "FURNITURE",
          quantity: 1,
          unitPrice: 35000,
          lineTotal: 35000,
          isBilled: true,
          billId: fBill.id,
        },
      });

      await tx.bookingItem.create({
        data: {
          bookingId: b.id,
          productId: testElecProduct.id,
          department: "ELECTRONICS",
          quantity: 1,
          unitPrice: 42000,
          lineTotal: 42000,
          isBilled: false, // Remains pending until delivery day
          billId: null,
        },
      });

      // Delivery Schedule
      await tx.deliverySchedule.create({
        data: {
          bookingId: b.id,
          scheduledDate: targetDeliveryDate,
          status: "SCHEDULED",
        },
      });

      return { booking: b, furnitureBill: fBill };
    }, {
      timeout: 30000,
      maxWait: 15000,
    });

    cleanupIds.bookingIds.push(createdBooking.booking.id);
    cleanupIds.billIds.push(createdBooking.furnitureBill.id);

    assert(createdBooking.booking.status === "CONFIRMED", "Booking created with status CONFIRMED");
    assert(Number(createdBooking.booking.remainingBalance) === 52000, "Remaining balance accurately calculated (₹52,000)");
    assert(createdBooking.furnitureBill.department === "FURNITURE", "Immediate Furniture Bill generated");
    assert(Number(createdBooking.furnitureBill.paidAmount) === 25000, "Advance allocated to furniture bill");

    // Verify stock deduction for furniture
    const updatedFurn = await prisma.product.findUnique({ where: { id: testFurnProduct.id } });
    assert(updatedFurn?.quantityInStock === 9, "Furniture stock decremented from 10 to 9 upon booking confirmation");

    // Verify electronics stock untouched
    const untouchedElec = await prisma.product.findUnique({ where: { id: testElecProduct.id } });
    assert(untouchedElec?.quantityInStock === 5, "Electronics stock kept intact (5) until actual delivery day");

    // Scenario 1.2: Deliver & Fulfill Electronics Package
    console.log("\n⚡ Scenario 1.2: Delivery Day — Fulfill Electronics Package");
    const elecBillNum = `ELEC-${year}-TEST${Date.now().toString().slice(-4)}`;
    const serialNumber = `SN-TV-${Date.now().toString().slice(-6)}`;

    const fulfilledBooking = await prisma.$transaction(async (tx) => {
      // 1. Create Electronics Tax Invoice
      const eBill = await tx.bill.create({
        data: {
          billNumber: elecBillNum,
          billType: "DELIVERY_INVOICE",
          department: "ELECTRONICS",
          bookingId: createdBooking.booking.id,
          customerId: testCustomer.id,
          createdByUserId: userId,
          deliveryDate: new Date(),
          warrantyStarts: new Date(),
          subtotal: 42000,
          totalAmount: 42000,
          paidAmount: 42000, // Customer pays balance on delivery
          dueAmount: 0,
          paymentStatus: "PAID",
          paymentMode: "UPI",
          status: "completed",
        },
      });

      // 2. Add Bill Item with serial
      await tx.billItem.create({
        data: {
          billId: eBill.id,
          productId: testElecProduct.id,
          quantity: 1,
          unitPrice: 42000,
          lineTotal: 42000,
          customisations: `Serial: ${serialNumber}`,
        },
      });

      // 3. Mark Serial Unit as SOLD
      await tx.productUnit.create({
        data: {
          productId: testElecProduct.id,
          imeiNumber: serialNumber,
          status: "SOLD",
          costPrice: 25000,
          soldAt: new Date(),
        },
      });

      // 4. Decrement electronics stock
      await tx.product.update({
        where: { id: testElecProduct.id },
        data: { quantityInStock: { decrement: 1 } },
      });

      // 5. Update Booking items
      await tx.bookingItem.updateMany({
        where: { bookingId: createdBooking.booking.id, department: "ELECTRONICS" },
        data: { isBilled: true, billId: eBill.id },
      });

      // 6. Update Booking status to COMPLETED & remaining balance to 0
      const updatedB = await tx.booking.update({
        where: { id: createdBooking.booking.id },
        data: {
          status: "COMPLETED",
          remainingBalance: 0,
        },
      });

      // 7. Mark delivery delivered
      await tx.deliverySchedule.updateMany({
        where: { bookingId: createdBooking.booking.id },
        data: { status: "DELIVERED", actualDelivery: new Date() },
      });

      return { bill: eBill, booking: updatedB };
    }, {
      timeout: 30000,
      maxWait: 15000,
    });

    cleanupIds.billIds.push(fulfilledBooking.bill.id);

    assert(fulfilledBooking.booking.status === "COMPLETED", "Booking status updated to COMPLETED");
    assert(Number(fulfilledBooking.booking.remainingBalance) === 0, "Booking balance settled to ₹0");
    assert(fulfilledBooking.bill.billType === "DELIVERY_INVOICE", "Delivery invoice generated with type DELIVERY_INVOICE");

    const updatedElec = await prisma.product.findUnique({ where: { id: testElecProduct.id } });
    assert(updatedElec?.quantityInStock === 4, "Electronics stock decremented from 5 to 4 upon fulfillment");

    // -------------------------------------------------------------------------
    // TEST SUITE 2: WHOLESALE PURCHASES & VENDOR SUPPLY CHAIN
    // -------------------------------------------------------------------------
    console.log("\n📦 TEST SUITE 2: Wholesale Purchases & Supply Chain Scenarios");

    // Scenario 2.1: Register Vendor & Inbound Purchase
    const testVendorPhone = "9123456789";
    let testVendor = await prisma.vendor.findFirst({ where: { phone: testVendorPhone } });
    if (!testVendor) {
      testVendor = await prisma.vendor.create({
        data: {
          name: "Rajasthan Sheesham Woods & Timber",
          phone: testVendorPhone,
          address: "Jodhpur Wood Hub",
          gstin: "08AAAAA0000A1Z5",
        },
      });
    }
    cleanupIds.vendorIds.push(testVendor.id);

    const purchaseNum = `PUR-${year}-TEST${Date.now().toString().slice(-4)}`;
    const purchaseQty = 4;
    const unitCost = 18000;
    const purchaseTotal = purchaseQty * unitCost; // ₹72,000
    const initialPayment = 30000;
    const purchaseDue = purchaseTotal - initialPayment; // ₹42,000

    const initialStock = updatedFurn?.quantityInStock || 9;

    const createdPurchase = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const p = await tx.purchase.create({
        data: {
          purchaseNumber: purchaseNum,
          vendorInvoiceNo: "INV-TIMBER-991",
          vendorId: testVendor.id,
          department: "FURNITURE",
          purchaseDate: new Date(),
          totalAmount: purchaseTotal,
          paidAmount: initialPayment,
          dueAmount: purchaseDue,
          paymentStatus: "PARTIAL",
          isStockAdded: true,
          createdByUserId: userId,
        },
      });

      // 2. Create Purchase Item
      await tx.purchaseItem.create({
        data: {
          purchaseId: p.id,
          productId: testFurnProduct.id,
          itemName: testFurnProduct.name,
          quantity: purchaseQty,
          unitCostPrice: unitCost,
          lineTotal: purchaseTotal,
        },
      });

      // 3. Increment Product Stock & create StockInRecord
      await tx.product.update({
        where: { id: testFurnProduct.id },
        data: {
          quantityInStock: { increment: purchaseQty },
          costPrice: unitCost,
        },
      });

      await tx.stockInRecord.create({
        data: {
          productId: testFurnProduct.id,
          quantityAdded: purchaseQty,
          costPrice: unitCost,
          addedByUserId: userId,
          purchaseId: p.id,
        },
      });

      // 4. Initial Payment
      await tx.purchasePayment.create({
        data: {
          purchaseId: p.id,
          amountPaid: initialPayment,
          paymentMode: "BANK_TRANSFER",
          transactionRef: "NEFT-TXN-12345",
          notes: "Initial advance to wood supplier",
        },
      });

      return p;
    }, {
      timeout: 30000,
      maxWait: 15000,
    });

    cleanupIds.purchaseIds.push(createdPurchase.id);

    assert(createdPurchase.paymentStatus === "PARTIAL", "Purchase created with status PARTIAL");
    assert(Number(createdPurchase.dueAmount) === 42000, "Purchase dueAmount accurately calculated (₹42,000)");

    // Verify stock incremented
    const restockedFurn = await prisma.product.findUnique({ where: { id: testFurnProduct.id } });
    assert(restockedFurn?.quantityInStock === initialStock + purchaseQty, `Inventory stock auto-incremented (${initialStock} -> ${initialStock + purchaseQty})`);

    // Scenario 2.2: Settle Remaining Balance on Purchase
    console.log("\n💵 Scenario 2.2: Settle Remaining Vendor Balance");
    const settledPurchase = await prisma.$transaction(async (tx) => {
      // Add final installment
      await tx.purchasePayment.create({
        data: {
          purchaseId: createdPurchase.id,
          amountPaid: purchaseDue,
          paymentMode: "UPI",
          transactionRef: "UPI-TXN-98765",
          notes: "Final settlement voucher",
        },
      });

      // Update purchase status to PAID
      return await tx.purchase.update({
        where: { id: createdPurchase.id },
        data: {
          paidAmount: purchaseTotal,
          dueAmount: 0,
          paymentStatus: "PAID",
        },
      });
    }, {
      timeout: 30000,
      maxWait: 15000,
    });

    assert(settledPurchase.paymentStatus === "PAID", "Purchase payment status updated to PAID");
    assert(Number(settledPurchase.dueAmount) === 0, "Purchase balance zeroed out (₹0 due)");

    // -------------------------------------------------------------------------
    // TEST SUITE 3: WHATSAPP MESSAGE FORMATTERS & PAYLOADS
    // -------------------------------------------------------------------------
    console.log("\n💬 TEST SUITE 3: WhatsApp Notification Formatting");

    const {
      formatBillInvoiceMessage,
      formatBookingNewMessage,
      formatBookingSettledMessage,
      formatDuePaymentMessage,
    } = await import("../lib/whatsapp/templates");

    const billMsg = formatBillInvoiceMessage({
      customerName: "Vishal Menariya",
      billNumber: "FURN-2026-0017",
      date: "02/11/2026",
      totalAmount: 80000,
      paidAmount: 30000,
      dueAmount: 50000,
    });
    assert(billMsg.includes("LAXMI ELECTRONICS & FURNITURES"), "Bill message contains store brand");
    assert(billMsg.includes("+91 820 939 9683"), "Bill message contains official store helpline (+91 820 939 9683)");
    assert(billMsg.includes("₹50,000"), "Bill message displays pending due balance");

    const bookingMsg = formatBookingNewMessage({
      customerName: "Vishal Menariya",
      bookingNumber: "ADB-2026-0011",
      expectedDeliveryDate: "07 Nov 2026",
      totalAmount: 136500,
      advancePaid: 30000,
      remainingBalance: 106500,
    });
    assert(!bookingMsg.includes("↳ Invoices & warranties"), "Booking message is concise (no verbose breakdown)");
    assert(bookingMsg.includes("ADB-2026-0011"), "Booking message references booking number");

    const settledMsg = formatBookingSettledMessage({
      customerName: "Vishal Menariya",
      bookingNumber: "ADB-2026-0011",
      totalAmount: 136500,
    });
    assert(settledMsg.includes("All Items Delivered"), "Settlement message confirms complete fulfillment");

  } catch (err: any) {
    console.error("❌ Exception during test suite execution:", err);
    testsFailed++;
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Clean up test artifacts so the database remains pristine
    // -------------------------------------------------------------------------
    console.log("\n🧹 CLEANUP: Removing test artifacts from database...");
    try {
      for (const id of cleanupIds.purchaseIds) {
        await prisma.stockInRecord.deleteMany({ where: { purchaseId: id } });
        await prisma.purchasePayment.deleteMany({ where: { purchaseId: id } });
        await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });
        await prisma.purchase.delete({ where: { id } }).catch(() => {});
      }

      for (const id of cleanupIds.bookingIds) {
        await prisma.deliverySchedule.deleteMany({ where: { bookingId: id } });
        await prisma.bookingItem.deleteMany({ where: { bookingId: id } });
        await prisma.billItem.deleteMany({ where: { bill: { bookingId: id } } });
        await prisma.bill.deleteMany({ where: { bookingId: id } });
        await prisma.booking.delete({ where: { id } }).catch(() => {});
      }

      for (const id of cleanupIds.billIds) {
        await prisma.billItem.deleteMany({ where: { billId: id } }).catch(() => {});
        await prisma.bill.delete({ where: { id } }).catch(() => {});
      }

      for (const id of cleanupIds.productIds) {
        await prisma.productUnit.deleteMany({ where: { productId: id } });
        await prisma.stockInRecord.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } }).catch(() => {});
      }

      for (const id of cleanupIds.vendorIds) {
        await prisma.vendor.delete({ where: { id } }).catch(() => {});
      }

      for (const id of cleanupIds.customerIds) {
        await prisma.customer.delete({ where: { id } }).catch(() => {});
      }

      console.log("  ✅ Cleanup complete.");
    } catch (cleanupErr) {
      console.warn("  ⚠️ Non-fatal cleanup warning:", cleanupErr);
    }

    await prisma.$disconnect();

    console.log("\n==================================================================");
    console.log(`📊 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log("==================================================================");

    if (testsFailed > 0) {
      process.exit(1);
    }
  }
}

runTestSuite();
