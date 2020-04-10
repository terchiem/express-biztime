process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

beforeAll(async function() {
  await db.query(`DELETE FROM companies`);
});

let testCompany;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('test', 'TestCompany', 'test description')
    RETURNING code, name, description`);

  testCompany = result.rows[0];
});

afterEach(async function() {
  await db.query("DELETE FROM companies");
});

afterAll(async function() {
  await db.end();
});


// Test Read
describe("GET /companies", function() {
  test("Gets a list of all companies", async function() {
    const res = await request(app).get(`/companies`);


    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      companies: [{
        code: testCompany.code,
        name: testCompany.name
      }]
    });
  });
});

describe("GET /companies/:code", function() {
  test("Gets a single company", async function() {
    const res = await request(app).get(`/companies/${testCompany.code}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({company: {
      code: testCompany.code,
      name: testCompany.name,
      description: testCompany.description,
      invoices: expect.any(Array) //make sure you test getting the actual invoice
    }});
  });

  test("Responds with 404 if company not found", async function() {
    const res = await request(app).get(`/companies/0`);

    expect(res.statusCode).toEqual(404);
  })
})


// Test Create
describe("POST /companies", function() {
  test("Creates a new company", async function() {
    let newCompany = {
      code: "new", 
      name: "new company", 
      description: "new description"
    };
    
    const res = await request(app).post("/companies")
      .send(newCompany);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual({
      company: newCompany
    });
  });

  test("Rejects invalid data", async function() {
    const res = await request(app).post("/companies").send({});

    expect(res.statusCode).toEqual(500)
  });
});


// Test Update
describe("PUT /companies/", function() {
  test("Updates a specified company", async function() {
    let updatedCompany = {
      name: "updated company", 
      description: "updated description"
    };
    
    const res = await request(app).put(`/companies/${testCompany.code}`)
      .send(updatedCompany);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      company: {
        code: testCompany.code,
        name: updatedCompany.name,
        description: updatedCompany.description
      }
    });
  });

  test("Respond with 404 if company not found", async function() {
    const res = await request(app).put(`/companies/0`);

    expect(res.statusCode).toEqual(404);
  })
})

// Test Delete
describe("DELETE /companies/:code", function() {
  test("Deletes the specified company", async function() {
    const res = await request(app).delete(`/companies/${testCompany.code}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({status: "deleted"});
  })

  test("Respond with 404 if company not found", async function() {
    const res = await request(app).delete(`/companies/0`);

    expect(res.statusCode).toEqual(404);
  })
})