package com.carlos.gamificationservice.repository;

import com.carlos.gamificationservice.models.UserGameSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface UserGameSessionRepository extends JpaRepository<UserGameSession, Long> {

    void deleteUserGameSessionsByUserName(String userName);
    void deleteByUserNameAndSessionDate(String userName, LocalDate intendedDate);

    List<UserGameSession> getAllByUserName(String userName);
    List<UserGameSession> getAllByUserNameAndSessionDate(String userName, LocalDate intendedDate);
    List<UserGameSession> getAllByUserNameAndPoints(String userName, Integer intendedPoints);
}
