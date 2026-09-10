import React from "react";
import NotaryDocumentDrop from "./NotaryDocumentDrop";

export const CentralNotaryApp = ({ user }: { user?: any }) => {
  return <NotaryDocumentDrop user={user} />;
};

export default CentralNotaryApp;
