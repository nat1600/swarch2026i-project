package com.carlos.gamificationservice.services.servicesImpl;

import com.carlos.gamificationservice.dtos.UserStreakMapper;
import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;
import com.carlos.gamificationservice.models.UserStreak;
import com.carlos.gamificationservice.repository.UserStreakRepository;
import com.carlos.gamificationservice.services.UserStreakService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class UserStreakServiceImplementation implements UserStreakService {

    private final UserStreakRepository userStreakRepository;
    private final UserStreakMapper userStreakMapper;

    @Override
    public UserStreakDTO registerUserActivity(String userName) {

        LocalDate today = LocalDate.now();

        UserStreak currentUserStreak = userStreakRepository.getUserStreakByUserName(userName);

        if (currentUserStreak == null) {
            UserStreak newUserActivity = new UserStreak();
            // This could be corrected with a dto
            newUserActivity.setUserName(userName);
            newUserActivity.setCurrentStreak(1);
            newUserActivity.setLastDateOfActivity(today);
            newUserActivity.setLongestStreak(1);
            userStreakRepository.save(newUserActivity);
        } else {
            long daysBetween = ChronoUnit.DAYS.between(currentUserStreak.getLastDateOfActivity(), today);

            if (daysBetween == 1) {
                int currentStreak = currentUserStreak.getCurrentStreak();
                currentUserStreak.setCurrentStreak(currentStreak + 1);
                currentUserStreak.setLastDateOfActivity(today);
                if ((currentStreak + 1) > currentUserStreak.getLongestStreak()) {
                    currentUserStreak.setLongestStreak(currentStreak + 1);
                }
            } else if (daysBetween > 1) {
                currentUserStreak.setCurrentStreak(1);
                currentUserStreak.setLastDateOfActivity(today);
            }

            userStreakRepository.save(currentUserStreak);
        }

        return userStreakMapper.toUserStreakDTO(userStreakRepository.getUserStreakByUserName(userName));
    }
}
