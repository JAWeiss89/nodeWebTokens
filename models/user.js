/** User class for message.ly */

const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register(username, password, first_name, last_name, phone) {

      if ( !username || !password || !first_name || !last_name || !phone) {
        throw new ExpressError("Missing required information to register user", 400);
      }
      // Hash Password 
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      // Make varibale for join_at and set it to time now.
      const dateNow = new Date();
      // Save to DB! 
      const results = await db.query(`
        INSERT INTO USERS
        (username, password, first_name, last_name, phone, join_at)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING username`,
        [username, hashedPassword, first_name, last_name, phone, dateNow]
        );
      const registeredUser = results.rows[0];
      return registeredUser;

  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    // Retrieve hashed password from db using username
    const results = await db.query(
      `SELECT * FROM users WHERE username=$1`, [username]
    )
    const foundUser = results.rows[0];
    const hashedPassword = foundUser.password;

    // compare hashed password with password that was passed in
    const isAuthentic = await bcrypt.compare(password, hashedPassword);
    return isAuthentic;
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    // Retrieve user from db
    const results = await db.query(
      `SELECT * FROM users WHERE username=$1`, [username]
    )
    const foundUser = results.rows[0];
    // Make varibale for join_at and set it to time now.
    const dateNow = new Date();
    if (foundUser) {
      await db.query(`UPDATE users SET last_login_at=$1 WHERE username=$2`, [dateNow, username])
    }
   }



  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`
      SELECT username, first_name, last_name, phone FROM users
      `)
    const users = results.rows;
    return users;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
      const results = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username=$1`, [username]);
      if (results.rows.length === 0) {
        throw new ExpressError("Could not find user with the username", 404);
      }
      const user = results.rows[0];
      return user;

   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`
      SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username=$1`, [username])
    const messages = results.rows;

    return messages;
  }







  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(`
      SELECT id, from_username, body, sent_at, read_at
      FROM messages
      WHERE to_username=$1`, [username])
    const messages = results.rows;

    return messages;
  }
}


module.exports = User;