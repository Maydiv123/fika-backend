const db = require('../config/db');

const reviewController = {
    // Get all reviews for a product
    getProductReviews: (req, res) => {
        const query = `
            SELECT r.*, u.name as user_name 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `;
        
        db.query(query, [req.params.productId], (err, results) => {
            if (err) {
                console.error('Error fetching reviews:', err);
                return res.status(500).json({ error: 'Error fetching reviews' });
            }
            res.json(results);
        });
    },

    // Add a review to a product
    addReview: (req, res) => {
        const { rating, comment, userId } = req.body;
        const productId = req.params.productId;

        // First, check if user has already reviewed this product
        const checkQuery = 'SELECT * FROM reviews WHERE product_id = ? AND user_id = ?';
        db.query(checkQuery, [productId, userId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error checking review:', checkErr);
                return res.status(500).json({ error: 'Error checking review' });
            }

            if (checkResults.length > 0) {
                return res.status(400).json({ error: 'You have already reviewed this product' });
            }

            // Add the review
            const insertQuery = `
                INSERT INTO reviews (product_id, user_id, rating, comment)
                VALUES (?, ?, ?, ?)
            `;

            db.query(insertQuery, [productId, userId, rating, comment], (err, result) => {
                if (err) {
                    console.error('Error adding review:', err);
                    return res.status(500).json({ error: 'Error adding review' });
                }

                // Update product rating and review count
                const updateProductQuery = `
                    UPDATE allproducts p
                    SET 
                        rating = (
                            SELECT AVG(rating) 
                            FROM reviews 
                            WHERE product_id = ?
                        ),
                        reviewsCount = (
                            SELECT COUNT(*) 
                            FROM reviews 
                            WHERE product_id = ?
                        )
                    WHERE p.id = ?
                `;

                db.query(updateProductQuery, [productId, productId, productId], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating product rating:', updateErr);
                        return res.status(500).json({ error: 'Error updating product rating' });
                    }

                    res.status(201).json({
                        message: 'Review added successfully',
                        reviewId: result.insertId
                    });
                });
            });
        });
    },

    // Update a review
    updateReview: (req, res) => {
        const { rating, comment } = req.body;
        const { reviewId } = req.params;
        const userId = req.body.userId;

        // Check if review exists and belongs to user
        const checkQuery = 'SELECT * FROM reviews WHERE id = ? AND user_id = ?';
        db.query(checkQuery, [reviewId, userId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error checking review:', checkErr);
                return res.status(500).json({ error: 'Error checking review' });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({ error: 'Review not found or unauthorized' });
            }

            const productId = checkResults[0].product_id;

            // Update the review
            const updateQuery = `
                UPDATE reviews 
                SET rating = ?, comment = ?
                WHERE id = ? AND user_id = ?
            `;

            db.query(updateQuery, [rating, comment, reviewId, userId], (err) => {
                if (err) {
                    console.error('Error updating review:', err);
                    return res.status(500).json({ error: 'Error updating review' });
                }

                // Update product rating
                const updateProductQuery = `
                    UPDATE allproducts p
                    SET 
                        rating = (
                            SELECT AVG(rating) 
                            FROM reviews 
                            WHERE product_id = ?
                        )
                    WHERE p.id = ?
                `;

                db.query(updateProductQuery, [productId, productId], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating product rating:', updateErr);
                        return res.status(500).json({ error: 'Error updating product rating' });
                    }

                    res.json({ message: 'Review updated successfully' });
                });
            });
        });
    },

    // Delete a review
    deleteReview: (req, res) => {
        const { reviewId } = req.params;
        const userId = req.body.userId;

        // Check if review exists and belongs to user
        const checkQuery = 'SELECT * FROM reviews WHERE id = ? AND user_id = ?';
        db.query(checkQuery, [reviewId, userId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error checking review:', checkErr);
                return res.status(500).json({ error: 'Error checking review' });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({ error: 'Review not found or unauthorized' });
            }

            const productId = checkResults[0].product_id;

            // Delete the review
            const deleteQuery = 'DELETE FROM reviews WHERE id = ? AND user_id = ?';
            db.query(deleteQuery, [reviewId, userId], (err) => {
                if (err) {
                    console.error('Error deleting review:', err);
                    return res.status(500).json({ error: 'Error deleting review' });
                }

                // Update product rating and review count
                const updateProductQuery = `
                    UPDATE allproducts p
                    SET 
                        rating = COALESCE(
                            (SELECT AVG(rating) FROM reviews WHERE product_id = ?),
                            0
                        ),
                        reviewsCount = (
                            SELECT COUNT(*) 
                            FROM reviews 
                            WHERE product_id = ?
                        )
                    WHERE p.id = ?
                `;

                db.query(updateProductQuery, [productId, productId, productId], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating product rating:', updateErr);
                        return res.status(500).json({ error: 'Error updating product rating' });
                    }

                    res.json({ message: 'Review deleted successfully' });
                });
            });
        });
    }
};

module.exports = reviewController; 