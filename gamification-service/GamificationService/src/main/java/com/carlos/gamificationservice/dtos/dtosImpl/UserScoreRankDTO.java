package com.carlos.gamificationservice.dtos.dtosImpl;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserScoreRankDTO {

    private String userName;
    private Integer score;
    private Long rank;

}
