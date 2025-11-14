import laptop from "@shared/assets/images/mainPage/laptop1.png";
import CustomNavigateButton from "@shared/ui/button/CustomNavigateButton";
import { EButtonTypes } from "@shared/config/enums/enums";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "./HomePage.scss";
const HomePage = () => {
  return (
    <div>
      <section className="main">
        <div className="main__container">
          <div className="main__content">
            <h1 className="main__content-title">
              Добро пожаловать в систему управления предприятием!
            </h1>
            <p className="main__content-text">
              Мы стремимся сделать управление бизнесом легким и эффективным,
              поэтому создали систему, которая позволит вам вести учет в режиме
              онлайн. Это дает вам возможность сосредоточиться на том, что вы
              делаете лучше всего, и не тратить время на заполнение таблиц и
              отчетов. Для работы с системой вам не нужна специальная
              подготовка. Поехали?
            </p>
            <CustomNavigateButton
              title="Поехали"
              path="/letters"
              type={EButtonTypes.BUTTON}
              classname="btn btn-accent btn-lg px-4 me-md-2"
              style={{ backgroundColor: "#E73F0C", borderColor: "#E73F0C" }}
            >
              Поехали
            </CustomNavigateButton>
          </div>
          <div className="main__image">
            <LazyLoadImage
              src={laptop}
              alt="Описание"
              effect="blur"
              className="main__image-img"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
