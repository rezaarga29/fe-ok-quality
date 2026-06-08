const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgb(31 41 55 / 1)",
    borderColor: state.isFocused
      ? "rgb(244 114 182 / 1)"
      : "rgb(168 85 247 / 0.4)",
    borderWidth: "1px",
    borderRadius: "0.5rem",
    color: "rgb(216 180 254 / 1)",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 300ms",
    boxShadow: state.isFocused ? "0 0 0 3px rgb(244 114 182 / 0.2)" : "none",
    minHeight: "36px",
    "&:hover": {
      borderColor: "rgb(244 114 182 / 0.5)",
    },
  }),
  input: (base, state) => ({
    ...base,
    color: state.isFocused ? "rgb(255 255 255 / 1)" : "rgb(216 180 254 / 1)",
    fontSize: "0.875rem",
    fontWeight: state.isFocused ? "500" : "400",
    "& input": {
      color: "rgb(255 255 255 / 1) !important",
    },
    "& input::placeholder": {
      color: "rgb(168 85 247 / 0.7)",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "rgb(31 41 55 / 1)",
    border: "1px solid rgb(168 85 247 / 0.4)",
    borderRadius: "0.5rem",
    marginTop: "0.5rem",
    zIndex: 9999,
    boxShadow: "0 10px 25px rgb(0 0 0 / 0.3)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "rgb(244 114 182 / 0.6)"
      : state.isFocused
      ? "rgb(168 85 247 / 0.3)"
      : "rgb(31 41 55 / 1)",
    color: state.isSelected ? "rgb(255 255 255 / 1)" : "rgb(216 180 254 / 1)",
    cursor: "pointer",
    padding: "10px 12px",
    fontWeight: state.isSelected ? "600" : "400",
    transition: "all 200ms",
    "&:active": {
      backgroundColor: "rgb(244 114 182 / 0.6)",
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: "rgb(216 180 254 / 1)",
    fontWeight: "500",
  }),
  placeholder: (base) => ({
    ...base,
    color: "rgb(168 85 247 / 0.7)",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "rgb(244 114 182 / 1)" : "rgb(168 85 247 / 1)",
    transition: "all 300ms",
    "&:hover": {
      color: "rgb(244 114 182 / 1)",
    },
  }),
  clearIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "rgb(244 114 182 / 1)" : "rgb(168 85 247 / 1)",
    transition: "all 300ms",
    "&:hover": {
      color: "rgb(244 114 182 / 1)",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "rgb(209 213 219 / 1)",
    fontSize: "0.875rem",
  }),
};

export default customSelectStyles;
