package com.carlos.gamificationservice.services.servicesImpl;

import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;
import com.carlos.gamificationservice.repository.LeaderBoardRepository;
import com.carlos.gamificationservice.services.LeaderBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderBoardServiceImplementation implements LeaderBoardService {

    private final LeaderBoardRepository leaderBoardRepository;

    @Override
    public BooleanDTO incrementScore(String userId, int points) {

        BooleanDTO result = new BooleanDTO();

        try {
            leaderBoardRepository.incrementScore(userId, points);
            result.setStatus(true);
        } catch (Exception e) {
            result.setStatus(false);
        }

        return result;
    }

    @Override
    public List<ZSetOperations.TypedTuple<String>> getTopNUsers(int weekYear, int weekNumber, int topNUsers) {
        return leaderBoardRepository.getTopN(weekYear, weekNumber, topNUsers);
    }

    @Override
    public int getUserScore(String userId, int weekYear, int weekNumber) {
        return leaderBoardRepository.getScore(userId, weekYear, weekNumber);
    }

    @Override
    public long getUserRank(String userId, int weekYear, int weekNumber) {
        return leaderBoardRepository.getRank(userId, weekYear, weekNumber);
    }
}
