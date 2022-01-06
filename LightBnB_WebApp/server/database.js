const properties = require('./json/properties.json');
const users = require('./json/users.json');
const {Pool} = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `
  SELECT *
  FROM users
  WHERE email = $1`;
  const value =  [email];
  return pool
  .query(queryString, value)
  .then((res) => { 
    if (!res) {
    return null;
  } else {
    return res.rows[0];
  } 
})
  .catch((err) => err.message);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
  .query(
    `SELECT *
    FROM users
    WHERE id = $1`, [id])
  .then((res) => { 
    if (!res) {
      return null;
    } else {
      return res.rows[0];
    } 
  })
  .catch((err) => err.message);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const queryString = `INSERT INTO users (name, email, password)
  VALUES ($1,$2,$3) RETURNING *;`;
  const values = [user.name, user.email, user.password]; //user.password = 'password' 

  return pool
    .query(queryString, values)
    .then((res)=> res.rows)
    .catch((err) => err.message);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
  FROM reservations 
  JOIN properties ON properties.id = reservations.property_id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2`;   
  
  const values = [guest_id, limit];
  return pool
    .query(queryString, values)
    .then((res)=> res.rows)
    .catch((err) => err.message); 
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
   
  const values = [];
 
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1 = 1
  `;

  // 3
  if (options.city) {
    values.push(`%${options.city}%`);
    queryString += `AND city LIKE $${values.length} `;
  }

  if (options.owner_id) {
    values.push(`%${options.owner_id}%`);
    queryString += `AND owner_id LIKE $${values.length} `;
  }

  if (options.minimum_price_per_night) {
    values.push(`${options.minimum_price_per_night * 100}`);
    queryString += `AND cost_per_night >= $${values.length} `;
  }

  if (options.maximum_price_per_night) {
    values.push(`${options.maximum_price_per_night * 100}`);
    queryString += `AND cost_per_night <= $${values.length} `;
  }

  if (options.minimum_rating) {
    values.push(`${options.minimum_rating}`);
    queryString += `AND property_reviews.rating >= $${values.length} `;
  }
  
  values.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${values.length};
  `;
  
  console.log(queryString, values);
  
  
  return pool.query(queryString, values).then((res) => res.rows);
  
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  
  const queryString = `
  INSERT INTO properties(title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code, owner_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;

  const values = [property.title, property.description, property.thumbnail_photo_url,
  property.cover_photo_url, property.cost_per_night, property.parking_spaces,
  property.number_of_bathrooms, property.number_of_bedrooms, property.country,
  property.street, property.city, property.province, property.post_code, property.owner_id];

  return pool
    .query(queryString, values)
    .then((res)=> res.rows)
    .catch((err) => {
      console.log(err.message)
     return err.message});
}
exports.addProperty = addProperty;
