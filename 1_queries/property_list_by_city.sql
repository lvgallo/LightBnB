SELECT properties.*, AVG(property_reviews.rating) AS average_rating
FROM properties 
JOIN property_reviews ON properties.id = property_id
WHERE properties.city = 'Vancouver' 
GROUP BY properties.id
HAVING AVG(property_reviews.rating) >= 4
ORDER BY cost_per_night ASC 
LIMIT 10;