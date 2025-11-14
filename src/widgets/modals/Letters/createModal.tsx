import React from "react";
import Modal from "@shared/ui/modal/Modal";
import { RiSave2Fill } from "react-icons/ri";
import CreateLetterForm from "@widgets/forms/Letters/CreateLetterForm/CreateLetterForm";
import type { CreateLetterModalProps } from "@shared/types/interfaces/interfaces";

const CreateModal: React.FC<CreateLetterModalProps> = ({
  open,
  setOpen,
  onCreated,
}) => {
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Новый документ"
      placement="top"
      size="lg"
      footerAlign="right"
      sheetSize="auto"
      contentClassName="edo-form"
      footer={
        <>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setOpen(false)}
          >
            Отмена
          </button>
          <button
            type="submit"
            form="create-letter-form"
            className="btn btn-primary"
            style={{
              backgroundColor: "#e8450e",
              borderColor: "#e8450e",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: ".5rem",
            }}
          >
            <RiSave2Fill size="1.4em" aria-hidden />
            Сохранить
          </button>
        </>
      }
    >
      <CreateLetterForm open={open} onCreated={onCreated} setOpen={setOpen} />
    </Modal>
  );
};

export default CreateModal;
