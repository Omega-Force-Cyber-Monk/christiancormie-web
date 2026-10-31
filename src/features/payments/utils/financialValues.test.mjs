import assert from "node:assert/strict";
import test from "node:test";
import {
  decimalAmount,
  financialAmount,
  formatFinancialAmount,
} from "./financialValues.ts";

test("wire Decimal strings preserve exact digits/scale beyond Number precision", () => {
  for (const value of [
    "9999999999.99",
    "9007199254740993.1200",
    "0.00000000000000000001",
    "-1234.500",
    "0.00",
  ])
    assert.equal(decimalAmount(value), value);
  assert.equal(
    formatFinancialAmount(financialAmount("9007199254740993.1200", "usd", "major")),
    "USD 9,007,199,254,740,993.1200",
  );
});
test("nullable/invalid/nonfinite/unsafe money never becomes zero or executes object coercion", () => {
  for (const value of [
    null,
    undefined,
    "",
    "  ",
    NaN,
    Infinity,
    -Infinity,
    true,
    false,
    {},
    [],
    "USD 12",
    "1,000.00",
    "1e3",
    Number.MAX_SAFE_INTEGER + 1,
    {
      toString() {
        throw new Error("Never coerce");
      },
    },
  ]) {
    assert.equal(decimalAmount(value), null);
    assert.equal(
      formatFinancialAmount(financialAmount(value, "USD", "major")),
      "Not available",
    );
  }
  assert.equal(decimalAmount(0), "0");
  assert.equal(decimalAmount(12.25), "12.25");
});
test("real zero, null, negatives and trailing decimals remain distinct", () => {
  assert.equal(
    formatFinancialAmount(financialAmount("0.00", "USD", "major")),
    "USD 0.00",
  );
  assert.equal(
    formatFinancialAmount(financialAmount(null, "USD", "major")),
    "Not available",
  );
  assert.equal(
    formatFinancialAmount(financialAmount("-001234.5000", "EUR", "major")),
    "EUR -1,234.5000",
  );
});
test("major and minor units are explicit and never silently divided/multiplied by 100", () => {
  assert.equal(
    formatFinancialAmount(financialAmount(1050, "USD", "major")),
    "USD 1,050",
  );
  assert.equal(
    formatFinancialAmount(financialAmount(1050, "USD", "minor")),
    "USD 1,050 minor units",
  );
  assert.equal(
    formatFinancialAmount(financialAmount(500, "JPY", "minor")),
    "JPY 500 minor units",
  );
  for (const value of ["10.50", 10.5])
    assert.equal(financialAmount(value, "USD", "minor").value, null);
});
test("currency is taken from the response, not defaulted or inferred from amount", () => {
  for (const code of ["USD", "EUR", "GBP", "JPY", "BHD"])
    assert.equal(financialAmount("1.230", code, "major").currency, code);
  assert.equal(
    formatFinancialAmount(financialAmount("1.230", "BHD", "major")),
    "BHD 1.230",
  );
  for (const currency of [undefined, null, "", "US", "dollars", "$", 1])
    assert.equal(
      formatFinancialAmount(financialAmount("12.50", currency, "major")),
      "Currency unavailable 12.50",
    );
});
test("server-returned breakdown values are preserved without new commission/deposit/settlement arithmetic", () => {
  const returned = {
    quotedAmount: "1200.00",
    depositAmount: "120.00",
    balanceDueAtEvent: "1080.00",
    commissionAmount: "8.04",
    vendorNetAmount: "111.96",
  };
  const adapted = Object.fromEntries(
    Object.entries(returned).map(([key, value]) => [
      key,
      financialAmount(value, null, "major"),
    ]),
  );
  for (const key of Object.keys(returned))
    assert.equal(adapted[key].value, returned[key]);
  assert.equal(adapted.commissionAmount.value, "8.04");
  assert.equal(adapted.commissionAmount.currency, null);
});
