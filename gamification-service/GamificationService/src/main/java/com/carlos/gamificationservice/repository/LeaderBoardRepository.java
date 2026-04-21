package com.carlos.gamificationservice.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

// This annotation tells spring that this is a data access component. This allows it to be treated as a bean, but also
// will translate any redis exception into the spring standard exception hierarchy.
@Repository
@RequiredArgsConstructor
public class LeaderBoardRepository {

    // This is the same object as in the RedisConfig class. It is automatically instantiated since it comes
    // from a bean. And also lombok could be helping.
    private final RedisTemplate<String, String> redisTemplate;

    private static final long TTL_DAYS = 8;

    // ── Key builder ──────────────────────────────────────────────────────────
    // This method creates a key per week. A key in redis is just the name of the table
    // it doesn't necessarily means the key in the key-value pair.
    public String buildKey(int weekYear, int weekNumber) {
        return String.format("leaderboard:weekly:%d:%02d", weekYear, weekNumber);
    }

    // Just an additional method that returns the key of the present week.
    public String currentWeekKey() {
        LocalDate now = LocalDate.now();
        return buildKey(now.get(IsoFields.WEEK_BASED_YEAR), now.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
    }

    // ── Write operations ─────────────────────────────────────────────────────


     // Add XP to a user's score for the current week.
     // Creates the entry automatically if it doesn't exist yet.
     // This method calls the .incrementScore() method, that under the hood
     // calls the ZYNCRBY method of redis.

    public void incrementScore(String userId, int xp) {
        String key = currentWeekKey();
        // By calling the .opsForZSet() we are using a sorted set of key-value pairs.
        redisTemplate.opsForZSet().incrementScore(key, userId, xp);
        // Reset TTL on every write to keep active leaderboards alive
        // Here is where the redis magic happens, the weeks are automatically deleted when the expiry date is reached.
        redisTemplate.expire(key, TTL_DAYS, TimeUnit.DAYS);
    }

    // ── Read operations ──────────────────────────────────────────────────────


    // Get top N users for a given week, ordered by XP descending.
    // Returns a list of (userId, score) pairs.
    public List<ZSetOperations.TypedTuple<String>> getTopN(int weekYear, int weekNumber, int topNUsers) {
        String key = buildKey(weekYear, weekNumber);
        Set<ZSetOperations.TypedTuple<String>> results = redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, topNUsers - 1);
        return results != null ? new ArrayList<>(results) : List.of();
    }

     // Get a user's rank in a given week (1-indexed, higher XP = lower rank number).
     // Returns -1 if the user has no score that week.
    public long getRank(String userId, int weekYear, int weekNumber) {
        String key = buildKey(weekYear, weekNumber);
        Long rank = redisTemplate.opsForZSet().reverseRank(key, userId);
        return rank != null ? rank + 1 : -1; // convert 0-indexed to 1-indexed
    }

    // Get a specific user's score for a given week.
    // Returns 0 if the user has no score that week.
    public int getScore(String userId, int weekYear, int weekNumber) {
        String key = buildKey(weekYear, weekNumber);
        Double score = redisTemplate.opsForZSet().score(key, userId);
        return score != null ? score.intValue() : 0;
    }
}
