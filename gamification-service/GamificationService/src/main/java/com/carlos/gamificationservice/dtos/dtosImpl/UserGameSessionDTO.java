package com.carlos.gamificationservice.dtos.dtosImpl;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class UserGameSessionDTO {

    private String userName;

    private String gamePlayed;
    private Integer points;

    private LocalDate sessionDate;

    public UserGameSessionDTO() {

    }
}
