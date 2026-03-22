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
public class UserStreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long streakId;

    private String userName; // Username. Useful for keeping the records associated to the user.

    private Integer currentStreak;
    private Integer longestStreak;

    private LocalDate lastDateOfActivity;

    public UserStreak() {

    }
}
