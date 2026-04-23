package com.trd.repository;

import com.trd.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByUserId(Long userId);
    List<Prediction> findByStockId(Long stockId);
    List<Prediction> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT p FROM Prediction p WHERE p.user.id = :userId AND p.stock.id = :stockId ORDER BY p.createdAt DESC")
    List<Prediction> findUserStockPredictions(@Param("userId") Long userId, @Param("stockId") Long stockId);
}

