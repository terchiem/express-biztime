process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app")
const db = require("../db")

beforeAll(async function() {
    await db.query(`DELETE FROM invoices`);
});

let testInvoice;
let TestCompany;

beforeEach(async function(){
    let compResult = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('test', 'TestCompany', 'test description')
    RETURNING code, name, description`);
    
    let invoiceResult = await db.query(`
    INSERT INTO invoices(comp_code, amt)
    VALUES ('test', '10')
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);

    testInvoice = invoiceResult.rows[0];
    testCompany = compResult.rows[0];
});

afterEach(async function() {
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
});

afterAll(async function() {
  await db.end();
});

//Test Read
describe("GET /invoices", function(){
  test("Displays list of all invoices", async function() {
    const res = await request(app).get("/invoices");

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      invoices: [{id: testInvoice.id,
                  comp_code: testInvoice.comp_code,
                }]
    });
  });
})

//Test read single invoice
describe("GET /invoices:id", function() {
  test("Display specific invoice", async function() {
    const res = await request(app).get(`/invoices/${testInvoice.id}`)

    delete testInvoice.comp_code;
    testInvoice.company = testCompany;
    testInvoice.add_date = testInvoice.add_date.toJSON();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({invoice: testInvoice  
    })

  })
})


describe("POST /invoices", function() {
  test("Creates a new invoice", async function(){
    let newInvoice = {
      comp_code: "test",
      amt: 999,
    }

    const res = await request(app).post("/invoices")
      .send(newInvoice);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({invoice:
    {id: expect.any(Number),
      comp_code: "test",
      amt: 999,
      paid: false,
      add_date: expect.any(String),
      paid_date: null,  
    }});
  })
})
// Test Create


// Test Update


// Test Delete