package com.carlos.gamificationservice.services;

import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;
import org.springframework.data.redis.core.ZSetOperations;

import java.util.List;


public interface LeaderBoardService {

    BooleanDTO incrementScore(String userId, int points);
    List<ZSetOperations.TypedTuple<String>> getTopNUsers(int weekYear, int weekNumber, int topNUsers);
    int getUserScore(String userId, int weekYear, int weekNumber);
    long getUserRank(String userId, int weekYear, int weekNumber);
}
