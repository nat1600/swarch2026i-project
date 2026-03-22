package com.carlos.gamificationservice.dtos.dtosImpl;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserStreakDTO {

    private Integer currentStreak;
    private Integer longestStreak;

    public UserStreakDTO() {
    }
}
