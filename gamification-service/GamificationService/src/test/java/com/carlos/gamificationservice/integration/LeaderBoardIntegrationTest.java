package com.carlos.gamificationservice.integration;

import com.carlos.gamificationservice.BaseIntegrationTest;
import com.carlos.gamificationservice.repository.LeaderBoardRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.temporal.IsoFields;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class LeaderBoardIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LeaderBoardRepository leaderBoardRepository;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private final String userId = "Ninja_Poliglota";

    // Unlike H2 which rolls back via @Transactional, Redis needs manual cleanup
    @AfterEach
    public void cleanRedis() {
        String key = leaderBoardRepository.currentWeekKey();
        redisTemplate.delete(key);
    }

    // ===================== POST /incrementScore =====================

    @Test
    public void testIncrementScore_Success() throws Exception {

        mockMvc.perform(post("/leaderBoard/incrementScore")
                        .header("userId", userId)
                        .param("newExp", "100"))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(true));

        // Verify score was actually saved in embedded Redis
        LocalDate now = LocalDate.now();
        int score = leaderBoardRepository.getScore(
                userId,
                now.get(IsoFields.WEEK_BASED_YEAR),
                now.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR)
        );
        assert score == 100;
    }

    @Test
    public void testIncrementScore_AccumulatesScore() throws Exception {

        // Act - increment score twice
        mockMvc.perform(post("/leaderBoard/incrementScore")
                        .header("userId", userId)
                        .param("newExp", "100"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/leaderBoard/incrementScore")
                        .header("userId", userId)
                        .param("newExp", "50"))
                .andExpect(status().isCreated());

        // Verify scores were accumulated in Redis
        LocalDate now = LocalDate.now();
        int score = leaderBoardRepository.getScore(
                userId,
                now.get(IsoFields.WEEK_BASED_YEAR),
                now.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR)
        );
        assert score == 150;
    }

    // ===================== GET /getLeaderBoard =====================

    @Test
    public void testGetLeaderBoard_ReturnsRankedUsers() throws Exception {

        // Arrange - insert scores directly into embedded Redis
        leaderBoardRepository.incrementScore("user1", 100);
        leaderBoardRepository.incrementScore("user2", 200);
        leaderBoardRepository.incrementScore("user3", 50);

        // Act & Assert - should return users ordered by score descending
        mockMvc.perform(get("/leaderBoard/getLeaderBoard"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].score").value(200))
                .andExpect(jsonPath("$[1].score").value(100))
                .andExpect(jsonPath("$[2].score").value(50));
    }

    @Test
    public void testGetLeaderBoard_ReturnsEmpty_WhenNoScores() throws Exception {

        // No scores inserted
        mockMvc.perform(get("/leaderBoard/getLeaderBoard"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ===================== GET /getUserRank =====================

    @Test
    public void testGetUserRank_ReturnsCorrectRankAndScore() throws Exception {

        // Arrange - insert multiple users so ranking is meaningful
        leaderBoardRepository.incrementScore("user1", 200);
        leaderBoardRepository.incrementScore(userId, 100);
        leaderBoardRepository.incrementScore("user3", 50);

        // Act & Assert - Ninja_Poliglota should be rank 2 with score 100
        mockMvc.perform(get("/leaderBoard/getUserRank")
                        .header("userName", userId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userName").value(userId))
                .andExpect(jsonPath("$.score").value(100))
                .andExpect(jsonPath("$.rank").value(2));
    }

    @Test
    public void testGetUserRank_ReturnsZeroScore_WhenUserHasNoScore() throws Exception {

        // No scores inserted for this user
        mockMvc.perform(get("/leaderBoard/getUserRank")
                        .header("userName", userId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userName").value(userId))
                .andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.rank").value(-1)); // -1 means not ranked
    }
}