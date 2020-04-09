const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");

const router = new express.Router();

const { NOT_FOUND, CREATE_CODE } = require("../globals");

/** Get request to /invoices => json array of all invoices */

router.get("/", async function (req, res, next) {
  try {
    let result = await db.query(`
            SELECT id, comp_code 
            FROM invoices`);

    return res.json({ invoices: result.rows });

  } catch (err) {
    return next(err);
  }
});

/**Returns obj on given invoice.
If invoice cannot be found, returns 404.
Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}} */

router.get("/:id", async function (req, res, next) {
  try {
    let invoiceResult = await db.query(`
      SELECT id, amt, paid, add_date, paid_date, comp_code
      FROM invoices
      WHERE id = $1`,
      [req.params.id])


    // get the company so we can append to invoice object later
    let targetCompCode = invoiceResult.rows[0].comp_code;

    let companyResult = await db.query(`
      SELECT code, name, description
      FROM companies
      WHERE code = $1`,
      [targetCompCode]);

    let invoice = invoiceResult.rows[0];
    invoice.company = companyResult.rows[0];
    // delete redundant comp_code attribute
    delete invoice.comp_code;

    return res.json({ invoice: invoice });

  } catch (err) {
    return next(err);
  }
});

/**Create new invoice on POST /invoices
 * Expects {comp_code, amt}
 * Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;

    let result = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt])

    return res.status(CREATE_CODE).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/**Updates invoice on PUT /invoices/id
 * Expects {amt}
 * Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.put("/:id", async function (req, res, next) {
  try {
    const { amt } = req.body;

    // update invoice in db
    let result = await db.query(`
      UPDATE invoices SET amt=$1
        WHERE id = $2
        RETURNING id, comp_code, amt, paid, add_date, paid_date
    `, [amt, req.params.id]);

    // throw error if no results
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice for ${req.params.id}!`, NOT_FOUND);
    }

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});


/**
 * DELETE "/invoices/:id"
 * Deletes the specified invoice.
 * 
 * Returns {status: "deleted"} on successful deletion.
 */
router.delete("/:id", async function (req, res, next) {
  try {
    // delete invoice in db
    let result = await db.query(`
      DELETE FROM invoices WHERE id = $1
        RETURNING id
    `, [req.params.id]);

    // throw error if no results
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find invoice for ${req.params.id}!`, NOT_FOUND);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;