package com.carlos.gamificationservice.controllers;

import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;
import com.carlos.gamificationservice.services.UserStreakService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @AllArgsConstructor: Should be reserved for objects that do not use any spring magic.
@RestController
@RequestMapping("/userStreak")
@RequiredArgsConstructor // Use this for concise initialization, and making more concise code.
public class UserStreakController {

    // If we don't use final, then @RequiredArgsConstructor won't work because it interprets that isn't required.
    private final UserStreakService userStreakService;

    @PostMapping("/postUserActivity")
    public ResponseEntity<UserStreakDTO> postUserStreak(@RequestHeader String userName) {
        try {
            UserStreakDTO registered = userStreakService.registerUserActivity(userName);
            return new ResponseEntity<>(registered, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getUserStreakData")
    public ResponseEntity<UserStreakDTO> getUserStreak(@RequestHeader String userName) {
        try {
            UserStreakDTO currentUserActivity = userStreakService.getUserActivity(userName);
            return new ResponseEntity<>(currentUserActivity, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
