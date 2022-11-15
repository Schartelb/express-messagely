/** User class for message.ly */
const db = require("../db");
const bcrypt = require("bcrypt")
const { BCRYPT_WORK_FACTOR } = require("../config");



/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const timestamp = new Date().toUTCString()
    const hashPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const results = await db.query(`INSERT INTO users 
    (username,password,first_name,last_name, phone,join_at,last_login_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING username,password,first_name,last_name, phone`,
      [username, hashPw, first_name, last_name, phone, timestamp, timestamp])
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {

    const results = await db.query(`SELECT username, password FROM users WHERE username=$1`,
      [username])
    const user = results.rows[0]
    if (user) {
      return await bcrypt.compare(password, user.password)
    }
  }


  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    const loginTime = new Date().toUTCString()
    await db.query(`UPDATE users SET last_login_at=$2 WHERE username=$1`,
      [username, loginTime])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name, phone
       FROM users
       `)
    return results.rows
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
    const results = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at
       FROM users WHERE username=$1
       `,
      [username])
    return results.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(fromUsername) {
    const results = await db.query(`SELECT m.id, m.to_username, m.body, m.sent_at, m.read_at,
      u.username, u.first_name, u.last_name, u.phone FROM messages AS m
       LEFT JOIN users AS u ON m.to_username=u.username 
       WHERE m.from_username=$1`, [fromUsername])
    const { id, body, sent_at, read_at,
      first_name, last_name, phone, username} = results.rows[0]
    const to_user = { username, first_name, last_name, phone }
    //TODO: iterate to_user for RETURN statement
    return [{ id, body, sent_at, read_at, to_user }]
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(toUsername) {
    const results = await db.query(`SELECT m.id, m.from_username, m.body, m.sent_at, m.read_at,
      u.username, u.first_name, u.last_name, u.phone FROM messages AS m
       LEFT JOIN users AS u ON m.from_username=u.username 
       WHERE m.to_username=$1`, [toUsername])
    const { id, body, sent_at, read_at,
      first_name, last_name, phone, username } = results.rows[0]
    const from_user = { username, first_name, last_name, phone }
    //TODO: iterate to_user for RETURN statement
    return [{ id, body, sent_at, read_at, from_user }]
  }

}

module.exports = User;