import { forwardRef } from "react";
import type { IGenderListProps } from "@shared/interfaces/interfaces";
import "./GenderList.scss";

const GenderList = forwardRef<HTMLSelectElement, IGenderListProps>(
  ({ value, onChange, onBlur }, ref) => {
    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="form-control gender-select"
      >
        <option value="m">Мужчина</option>
        <option value="f">Женщина</option>
      </select>
    );
  }
);

GenderList.displayName = "GenderList";
export default GenderList;
