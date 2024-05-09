import { supabase } from "../supabase/supabase";

const getFolderName = async (id) => {
  console.log("called!");
  const { data, error } = await supabase
    .from("folders")
    .select("name")
    .eq("id", id);

  if (error) {
    console.log(error);
  } else {
    return data[0].name;
  }
};

export default getFolderName;
