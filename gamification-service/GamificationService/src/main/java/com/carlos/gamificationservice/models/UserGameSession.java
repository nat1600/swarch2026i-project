package com.carlos.gamificationservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@AllArgsConstructor
public class UserGameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long gameSessionRecordId;

    private String userName;

    private String gamePlayed;
    private Integer points;

    private LocalDate sessionDate;

    public UserGameSession() {

    }
}

