'use client';

import { Box, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent } from '@mui/material';
import {
  EducationForm,
  RatingFilters as RatingFiltersType,
  SpecialtyFilter,
  StudyPeriod,
} from '../../entities/Rating/RatingData';
import styles from './RatingFilters.module.css';

type Props = {
  filters: RatingFiltersType;
  onChange: (filters: RatingFiltersType) => void;
};

export const RatingFilters = ({ filters, onChange }: Props) => {
  const handlePeriodChange = (event: SelectChangeEvent<StudyPeriod>) => {
    onChange({ ...filters, period: event.target.value as StudyPeriod });
  };

  const handleEducationFormChange = (event: SelectChangeEvent<EducationForm>) => {
    onChange({ ...filters, educationForm: event.target.value as EducationForm });
  };

  const handleSpecialtyChange = (event: SelectChangeEvent<SpecialtyFilter>) => {
    onChange({ ...filters, specialty: event.target.value as SpecialtyFilter });
  };

  return (
    <Paper className={styles.container} elevation={2}>
      <Box className={styles.filtersGrid}>
        <FormControl fullWidth size="small">
          <InputLabel id="period-label">Период</InputLabel>
          <Select labelId="period-label" value={filters.period} label="Период" onChange={handlePeriodChange}>
            <MenuItem value="all_time">За весь период</MenuItem>
            <MenuItem value="last_session">За последнюю сессию</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="education-form-label">Форма обучения</InputLabel>
          <Select
            labelId="education-form-label"
            value={filters.educationForm}
            label="Форма обучения"
            onChange={handleEducationFormChange}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="budget">Бюджет</MenuItem>
            <MenuItem value="contract">Контракт</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="specialty-label">Специальность</InputLabel>
          <Select
            labelId="specialty-label"
            value={filters.specialty}
            label="Специальность"
            onChange={handleSpecialtyChange}
          >
            <MenuItem value="all">Любая</MenuItem>
            <MenuItem value="my_specialty">Моя специальность</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};
