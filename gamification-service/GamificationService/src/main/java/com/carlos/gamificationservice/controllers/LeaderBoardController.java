package com.carlos.gamificationservice.controllers;

import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;

import com.carlos.gamificationservice.dtos.dtosImpl.UserScoreRankDTO;
import com.carlos.gamificationservice.services.LeaderBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.List;

@RestController
@RequestMapping("/leaderBoard")
@RequiredArgsConstructor
public class LeaderBoardController {

    private final LeaderBoardService leaderBoardService;

    @PostMapping("/incrementScore")
    public ResponseEntity<BooleanDTO> postUserXp(@RequestHeader String userId, @RequestParam Integer newExp) {

        BooleanDTO result = leaderBoardService.incrementScore(userId, newExp);

        if (result.isStatus()) {
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(result, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getLeaderBoard")
    public ResponseEntity<List<UserScoreRankDTO>> getPresentWeekLeaderBoard() {

        LocalDate currentWeek = LocalDate.now();

        int year = currentWeek.get(IsoFields.WEEK_BASED_YEAR);
        int weekOfTheYear = currentWeek.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        List<ZSetOperations.TypedTuple<String>> tuples = leaderBoardService.getTopNUsers(year, weekOfTheYear, 15);

        List<UserScoreRankDTO> result = new java.util.ArrayList<>();
        for (int i = 0; i < tuples.size(); i++) {
            ZSetOperations.TypedTuple<String> tuple = tuples.get(i);
            String userName = tuple.getValue() != null ? tuple.getValue() : "";
            int score = tuple.getScore() != null ? tuple.getScore().intValue() : 0;
            result.add(new UserScoreRankDTO(userName, score, (long) (i + 1)));
        }

        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/getUserRank")
    public ResponseEntity<UserScoreRankDTO> getUserRank(@RequestHeader String userName) {

        LocalDate currentWeek = LocalDate.now();

        int year = currentWeek.get(IsoFields.WEEK_BASED_YEAR);
        int weekOfTheYear = currentWeek.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);

        Integer result = leaderBoardService.getUserScore(userName, year, weekOfTheYear);
        Long position = leaderBoardService.getUserRank(userName, year, weekOfTheYear);

        UserScoreRankDTO userScoreRankDTO = new UserScoreRankDTO(userName, result, position);

        return new ResponseEntity<>(userScoreRankDTO, HttpStatus.OK);
    }

}
