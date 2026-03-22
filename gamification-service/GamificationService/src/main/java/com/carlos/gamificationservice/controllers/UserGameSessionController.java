package com.carlos.gamificationservice.controllers;

import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;
import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import com.carlos.gamificationservice.services.UserGameSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/userGameSession")
@RequiredArgsConstructor
public class UserGameSessionController {

    private final UserGameSessionService userGameSessionService;

    @PostMapping("/saveGameSession")
    public ResponseEntity<UserGameSessionDTO> postGameSessionData(@RequestBody UserGameSessionDTO newGameSessionData) {

        UserGameSessionDTO result = userGameSessionService.saveUserGameSession(newGameSessionData);

        if (result != null) {
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>(result, HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @DeleteMapping("/deleteAllUserGameSessions")
    public ResponseEntity<BooleanDTO> deleteAllUserGameSessions(@RequestHeader String userName) {

        BooleanDTO result = userGameSessionService.deleteAllUserGameSessions(userName);

        if (result.isStatus()) {
            return new ResponseEntity<>(result, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @DeleteMapping("/deleteAllUserGameSessionsPerDate")
    public ResponseEntity<BooleanDTO> deleteAllUserGameSessionsPerDate(@RequestHeader String userName, @RequestParam LocalDate intendedDate) {

        BooleanDTO result = userGameSessionService.deleteAllUserGameSessionsPerDate(userName, intendedDate);

        if (result.isStatus()) {
            return new ResponseEntity<>(result, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @GetMapping("/getAllUserGameSessions")
    public ResponseEntity<List<UserGameSession>> getAllUserGameSessions(@RequestHeader String userName) {

        List<UserGameSession> gameSessions = userGameSessionService.getAllUserGameSessions(userName);

        if (gameSessions != null) {
            return new ResponseEntity<>(gameSessions, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @GetMapping("/getAllUserGameSessionsPerDate")
    public ResponseEntity<List<UserGameSession>> getAllUserGameSessionsPerDate(@RequestHeader String userName, @RequestParam LocalDate intendedDate) {

        List<UserGameSession> gameSessions = userGameSessionService.getAllUserGameSessionsPerDate(userName, intendedDate);

        if (gameSessions != null) {
            return new ResponseEntity<>(gameSessions, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @GetMapping("/getAllUserGameSessionsPerPoints")
    public ResponseEntity<List<UserGameSession>> getAllUserGameSessionsPerPoints(@RequestHeader String userName, @RequestParam Integer intendedPoints) {

        List<UserGameSession> gameSessions = userGameSessionService.getAllUserGameSessionsPerPoints(userName, intendedPoints);

        if (gameSessions != null) {
            return new ResponseEntity<>(gameSessions, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

}
