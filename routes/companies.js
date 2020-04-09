const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError")

const router = new express.Router();

const NOT_FOUND = 404

/**
 * GET "/companies" 
 * Get back a list of all companies
 * 
 * Returns a list as JSON for all companies, like {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res, next) {
  try {
    // get all companies from db
    let result = await db.query(`SELECT code, name FROM companies`);

    return res.json({companies: result.rows});
  } catch(err) {
    return next(err);
  }
});


/** 
 * GET "/companies/:code"
 * Get back the specified company.
 * 
 * Returns a JSON obj for the company: {company: {code, name, description}}
 */
router.get("/:code", async function (req, res, next) {
  try {
    // get specific company from db
    let result = await db.query(`
      SELECT code, name, description
        FROM companies
        WHERE code = $1
    `, [req.params.code])

    // throw error if no results
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find company for ${req.params.code}!`, 404);
    }

    return res.json({company: result.rows[0]});
  } catch(err) {
    return next(err);
  }
});

 
/**
 * POST "/companies"
 * Adds a company. Needs to be given JSON like: {code, name, description}
 * 
 * Returns a JSON obj of new company: {company: {code, name, description}}
 */
router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;

    // add company to db
    let result = await db.query(`
      INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description
    `, [code, name, description]);

    return res.status(201).json({company: result.rows[0]});
  } catch(err) {
    return next(err);
  }
});


/**
 * PUT "/companies/:code"
 * Edit an existing company. Needs to be given JSON like: {name, description}
 * 
 * Returns the updated company as JSON obj: {company: {code, name, description}}
 */
router.put("/:code", async function (req, res, next) {
  try {
    const { name, description } = req.body;

    // update company in db
    let result = await db.query(`
      UPDATE companies SET name=$1, description=$2
        WHERE code = $3
        RETURNING code, name, description
    `, [name, description, req.params.code]);

    // throw error if no results
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find company for ${req.params.code}!`, 404);
    }

    return res.json({company: result.rows[0]});
  } catch(err) {
    return next(err);
  }
});


/**
 * DELETE "/companies/:code"
 * Deletes the specified company.
 * 
 * Returns {status: "deleted"} on successful deletion.
 */
router.delete("/:code", async function (req, res, next) {
  try {
    // delete company in db
    let result = await db.query(`
      DELETE FROM companies WHERE code = $1
        RETURNING code
    `, [req.params.code]);

    // throw error if no results
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find company for ${req.params.code}!`, 404);
    }

    return res.json({status: "deleted"})    ;
  } catch(err) {
    return next(err);
  }
});


module.exports = router;