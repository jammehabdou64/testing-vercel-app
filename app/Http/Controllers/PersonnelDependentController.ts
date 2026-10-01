import { Action, Controller, HttpException, Inject } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { Personnel } from "../../Models/Personnel";
import { PersonnelDependent } from "../../Models/PersonnelDependent";
import { PersonnelDependentPolicy } from "../../Policies/PersonnelDependentPolicy";
import { StorePersonnelDependentRequest } from "../Requests/StorePersonnelDependentRequest";
import { UpdatePersonnelDependentRequest } from "../Requests/UpdatePersonnelDependentRequest";

@Inject()
export class PersonnelDependentController extends Controller {
  @Action()
  async store(personnel: Personnel, form: StorePersonnelDependentRequest) {
    const actor = await currentActor(form);
    if (!new PersonnelDependentPolicy().create(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    const now = timestamp();
    const dependent = await PersonnelDependent.create({
      personnel_id: Number(personnel.id),
      full_name: String(data.full_name),
      relationship: String(data.relationship),
      date_of_birth: data.date_of_birth == null || data.date_of_birth === ""
        ? null
        : String(data.date_of_birth),
      created_at: now,
      updated_at: now,
    });

    return response().redirect(`/personnel/${personnel.id}`).toResponse();
  }

  @Action()
  async update(
    personnel: Personnel,
    dependent: PersonnelDependent,
    form: UpdatePersonnelDependentRequest,
  ) {
    this.ensureChild(personnel, dependent);
    const actor = await currentActor(form);
    if (!new PersonnelDependentPolicy().update(actor, dependent)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    dependent.setAttribute("full_name", String(data.full_name));
    dependent.setAttribute("relationship", String(data.relationship));
    dependent.setAttribute(
      "date_of_birth",
      data.date_of_birth == null || data.date_of_birth === ""
        ? null
        : String(data.date_of_birth),
    );
    dependent.setAttribute("updated_at", timestamp());
    await dependent.save();

    return response().redirect(`/personnel/${personnel.id}`).toResponse();
  }

  @Action()
  async destroy(personnel: Personnel, dependent: PersonnelDependent) {
    this.ensureChild(personnel, dependent);
    const actor = await currentActor(request());
    if (!new PersonnelDependentPolicy().delete(actor, dependent)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    await dependent.delete();
    return response().redirect(`/personnel/${personnel.id}`).toResponse();
  }

  private ensureChild(personnel: Personnel, dependent: PersonnelDependent): void {
    if (Number(dependent.getAttribute("personnel_id")) !== Number(personnel.id)) {
      throw new HttpException(404, "Not found.");
    }
  }
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
