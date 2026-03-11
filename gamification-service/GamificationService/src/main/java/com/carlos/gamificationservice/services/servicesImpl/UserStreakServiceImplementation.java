package com.carlos.gamificationservice.services.servicesImpl;

import com.carlos.gamificationservice.dtos.UserStreakMapper;
import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;
import com.carlos.gamificationservice.models.UserStreak;
import com.carlos.gamificationservice.repository.UserStreakRepository;
import com.carlos.gamificationservice.services.UserStreakService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@AllArgsConstructor
public class UserStreakServiceImplementation implements UserStreakService {

    UserStreakRepository userStreakRepository;
    UserStreakMapper userStreakMapper;

    @Override
    public UserStreakDTO registerUserActivity(UserStreak newUserActivity) {

        LocalDate today = LocalDate.now();

        UserStreak currentUserStreak = userStreakRepository.getUserStreakByUserName(newUserActivity.getUserName());

        if (currentUserStreak == null) {
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

        return userStreakMapper.toUserStreakDTO(userStreakRepository.getUserStreakByUserName(newUserActivity.getUserName()));
    }
}
