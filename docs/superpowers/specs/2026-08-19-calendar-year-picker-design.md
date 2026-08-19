# Calendar Year Picker Design

## Goal

Keep the date-time picker sheet at a stable height when changing months and add a fast year/month picker matching the supplied mobile references.

## Interaction

- The calendar always renders 42 day cells in six rows, including empty leading and trailing cells. Month changes therefore do not resize the sheet.
- The month heading is a button. Activating it replaces the calendar grid with two scroll wheels: year and month.
- The year wheel covers 50 years before through 50 years after the current year. The month wheel contains January through December.
- Both wheels use a fixed center selection band. Scrolling updates the visible year/month immediately.
- Activating the month heading again, or selecting a month item, returns to the calendar for the chosen month.
- Previous/next buttons remain available in calendar mode and continue to cross year boundaries correctly.
- Changing the visible month does not change the selected date until the user chooses a day.
- Time selection, cancel, and confirm behavior remain unchanged.

## Component Changes

Keep the behavior inside `DateTimePickerSheet.vue` because it is local to this picker:

- Extend the computed calendar cells to a fixed length of 42.
- Add a `monthPickerOpen` state and year/month wheel data.
- Reuse the existing fixed-wheel interaction pattern used by the time picker.
- Make the month heading accessible with `aria-expanded` and a clear label.
- Hide the calendar grid while the year/month wheels are open, while preserving the same calendar-stage height.

## Layout

- Give the calendar stage a stable height derived from six calendar rows.
- The year/month picker occupies that same stage instead of opening another modal.
- Keep existing colors, spacing, corner radii, and compact mobile sheet proportions.
- Preserve the short-screen media query and ensure the fixed stage fits within `100dvh`.

## Testing

- Verify months that naturally need five and six rows both render 42 cells.
- Verify previous/next month navigation crosses a year boundary.
- Verify opening the heading exposes year and month wheels.
- Verify choosing a year/month changes the visible calendar while leaving the selected date unchanged until a day is clicked.
- Run the component tests, complete unit suite, production build, and mobile viewport visual check.

## Out Of Scope

- Changing date storage or output formatting.
- Adding day-range selection.
- Changing the existing time-wheel behavior.
