from datetime import date, timedelta


def apply_sm2(
    quality: int,
    repetitions: int,
    easiness: float,
    interval: int,
) -> tuple[int, float, int, date]:
    """
    SM-2 algorithm
    quality:     0-5 (0-2 = failed, 3-5 = passed)
    repetitions: number of successful reviews
    easiness:    easiness factor (min 1.3)
    interval:    days until next review
    
    Returns: (repetitions, easiness, interval, next_review_date)

    Example like it workss:
     If you send quality: 5 in a new sentence, 
     the system will show it to you in 6 days. If you remember it correctly, 
     in ~15 days. If you fail, go back to 1 day. 
    """
    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * easiness)
        repetitions += 1

    easiness = max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    next_review = date.today() + timedelta(days=interval)

    return repetitions, easiness, interval, next_review